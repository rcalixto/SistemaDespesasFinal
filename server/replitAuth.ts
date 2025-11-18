import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const claims = tokens.claims();
      const email = claims["email"];
      const userId = claims["sub"];
      
      // Validação estrita: email obrigatório e apenas @abert.org.br
      if (!email) {
        console.warn("[Auth] Login rejeitado: email ausente nos claims");
        return verified(new Error("Acesso permitido apenas para contas @abert.org.br"), false);
      }
      
      // Normalizar email para lowercase antes da validação
      const normalizedEmail = email.toLowerCase().trim();
      if (!normalizedEmail.endsWith("@abert.org.br")) {
        console.log(`[Auth] Login rejeitado: ${normalizedEmail} não é domínio @abert.org.br`);
        return verified(new Error("Acesso permitido apenas para contas @abert.org.br"), false);
      }
      
      if (!userId) {
        console.warn("[Auth] Login rejeitado: user ID ausente nos claims");
        return verified(new Error("Erro de autenticação: identificador ausente"), false);
      }
      
      const user = { id: userId };
      updateUserSession(user, tokens);
      await upsertUser(claims);
      verified(null, user);
    } catch (error) {
      console.error("[Auth] Erro durante verificação:", error);
      verified(error as Error, false);
    }
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const callbackURL = `https://${domain}/api/callback`;
      console.log(`[Auth] Registering strategy for domain: ${domain}, callback: ${callbackURL}`);
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Get the full host including port from the Host header
    const host = req.get('host') || req.hostname || 'localhost';
    console.log(`[Auth] Login attempt - host: ${host}, hostname: ${req.hostname}, headers:`, req.headers);
    ensureStrategy(host);
    passport.authenticate(`replitauth:${host}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const host = req.get('host') || req.hostname || 'localhost';
    console.log(`[Auth] Callback - host: ${host}`);
    ensureStrategy(host);
    passport.authenticate(`replitauth:${host}`, (err: Error | null, user: any, info: any) => {
      if (err) {
        console.error("[Auth] Callback error:", err.message);
        return res.redirect("/auth-error?message=" + encodeURIComponent(err.message));
      }
      if (!user) {
        console.log("[Auth] Callback: user authentication failed");
        return res.redirect("/auth-error?message=Acesso%20permitido%20apenas%20para%20contas%20@abert.org.br");
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("[Auth] Login error:", loginErr);
          return res.redirect("/auth-error?message=" + encodeURIComponent(loginErr.message));
        }
        console.log("[Auth] Login successful, redirecting to /");
        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
