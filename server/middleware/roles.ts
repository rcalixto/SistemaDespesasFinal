import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    
    if (!user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = user.claims.sub;
    const colaborador = await storage.getColaboradorByUserId(userId);
    
    if (!colaborador) {
      return res.status(404).json({ message: "Colaborador not found" });
    }

    const roles = await storage.getColaboradorRoles(colaborador.id);
    const userRoles = roles.map(r => r.role);

    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role)) || userRoles.includes("Administrador");
    
    if (!hasRequiredRole) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    (req as any).colaborador = colaborador;
    (req as any).userRoles = userRoles;
    
    next();
  };
}

export const requireDiretoria = requireRole(["Diretoria", "Administrador"]);
export const requireFinanceiro = requireRole(["Financeiro", "Administrador"]);
export const requireDiretoriaOrFinanceiro = requireRole(["Diretoria", "Financeiro", "Administrador"]);
