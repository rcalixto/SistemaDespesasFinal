import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import express from "express";
import path from "path";
import {
  insertCentroCustoSchema,
  insertDiretoriaSchema,
  insertAdiantamentoSchema,
  insertReembolsoSchema,
  insertReembolsoItemSchema,
  insertPassagemAereaSchema,
  insertHospedagemSchema,
  insertViagemExecutadaSchema,
  insertHospedagemExecutadaSchema,
  insertPrestacaoAdiantamentoSchema,
  insertPrestacaoAdiantamentoItemSchema,
  type InsertReembolsoItem,
  type InsertPrestacaoAdiantamentoItem,
} from "@shared/schema";
// Referenced from: blueprint:javascript_object_storage
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import * as emailService from "./emailService";

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Helper to get current colaborador for logged-in user
async function getCurrentColaborador(req: Request) {
  const user = req.user as any;
  if (!user?.id) return null;
  
  const colaborador = await storage.getColaboradorByUserId(user.id);
  return colaborador;
}

// Helper to get emails of users with specific role
async function getEmailsByRole(role: 'Diretoria' | 'Financeiro'): Promise<string[]> {
  const colaboradores = await storage.getColaboradoresByRole(role);
  return colaboradores
    .map(c => c.email)
    .filter((email): email is string => email !== null);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // STATIC FILES - Serve uploaded files
  // ============================================================================
  const uploadsPath = path.resolve(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsPath));

  // ============================================================================
  // AUTH SETUP
  // ============================================================================
  
  await setupAuth(app);

  // Note: /api/auth/user is now handled in replitAuth.ts
  
  // ============================================================================
  // DESENVOLVIMENTO - Login de teste (REMOVER EM PRODUÇÃO)
  // ============================================================================
  
  app.get("/api/login-test", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).send("Not found");
    }
    
    // Usuário de teste com todos os campos necessários
    const testUser = {
      id: "test-user-abert-123",
      claims: {
        sub: "test-user-abert-123",
        email: "teste@abert.org.br",
        first_name: "João",
        last_name: "Silva Teste",
        profile_image_url: "https://ui-avatars.com/api/?name=Joao+Silva&background=004650&color=FFC828",
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 dias
      },
      access_token: "test-token",
      refresh_token: "test-refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 dias
    };
    
    req.login(testUser, (err) => {
      if (err) {
        console.error("[Test Login] Error:", err);
        return res.status(500).send("Erro ao criar sessão de teste");
      }
      console.log("[Test Login] Sessão criada para usuário de teste");
      res.redirect("/");
    });
  });

  // ============================================================================
  // OBJECT STORAGE - Upload e download de comprovantes
  // Referenced from: blueprint:javascript_object_storage
  // ============================================================================

  // Endpoint para servir arquivos privados (comprovantes)
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Endpoint para obter URL de upload
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Endpoint para definir ACL de um comprovante após upload
  app.put("/api/comprovantes", isAuthenticated, async (req, res) => {
    if (!req.body.comprovanteURL) {
      return res.status(400).json({ error: "comprovanteURL is required" });
    }

    const userId = (req.user as any)?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.comprovanteURL,
        {
          owner: userId,
          // Comprovantes são privados - apenas o dono e administradores podem acessar
          visibility: "private",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting comprovante ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================================================
  // CENTROS DE CUSTO
  // ============================================================================

  app.get("/api/centros-custo", isAuthenticated, async (req, res) => {
    try {
      const centros = await storage.getCentrosCusto();
      res.json(centros);
    } catch (error) {
      console.error("Error getting centros de custo:", error);
      res.status(500).json({ error: "Failed to get centros de custo" });
    }
  });

  app.post("/api/centros-custo", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCentroCustoSchema.parse(req.body);
      const centro = await storage.createCentroCusto(validatedData);
      res.status(201).json(centro);
    } catch (error) {
      console.error("Error creating centro de custo:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create centro de custo" });
    }
  });

  // ============================================================================
  // DIRETORIAS
  // ============================================================================

  app.get("/api/diretorias", isAuthenticated, async (req, res) => {
    try {
      const diretorias = await storage.getDiretorias();
      res.json(diretorias);
    } catch (error) {
      console.error("Error getting diretorias:", error);
      res.status(500).json({ error: "Failed to get diretorias" });
    }
  });

  app.post("/api/diretorias", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDiretoriaSchema.parse(req.body);
      const diretoria = await storage.createDiretoria(validatedData);
      res.status(201).json(diretoria);
    } catch (error) {
      console.error("Error creating diretoria:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create diretoria" });
    }
  });

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador não encontrado" });
      }

      const stats = await storage.getDashboardStats(colaborador.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // ============================================================================
  // RELATÓRIOS - Dados agregados para análise
  // ============================================================================

  app.get("/api/relatorios", isAuthenticated, async (req, res) => {
    try {
      // Obter parâmetros de filtro - garantir que são strings não vazias
      const dataInicio = typeof req.query.dataInicio === 'string' && req.query.dataInicio.trim() !== '' ? req.query.dataInicio.trim() : null;
      const dataFim = typeof req.query.dataFim === 'string' && req.query.dataFim.trim() !== '' ? req.query.dataFim.trim() : null;
      const diretoria = typeof req.query.diretoria === 'string' && req.query.diretoria.trim() !== '' ? req.query.diretoria.trim() : null;
      const statusFilter = typeof req.query.status === 'string' && req.query.status.trim() !== '' ? req.query.status.trim() : null;

      // Query para adiantamentos agregados por status
      const adiantamentosPorStatus = await db.execute(sql`
        SELECT 
          status,
          COUNT(*)::int as quantidade,
          SUM(valor_solicitado)::numeric as valor_total
        FROM adiantamentos
        WHERE deleted_at IS NULL
          ${dataInicio ? sql`AND data_solicitacao >= ${dataInicio}::date` : sql``}
          ${dataFim ? sql`AND data_solicitacao <= ${dataFim}::date` : sql``}
          ${diretoria ? sql`AND diretoria_responsavel = ${diretoria}` : sql``}
          ${statusFilter ? sql`AND status = ${statusFilter}` : sql``}
        GROUP BY status
      `);

      // Query para reembolsos agregados por status
      const reembolsosPorStatus = await db.execute(sql`
        SELECT 
          status,
          COUNT(*)::int as quantidade,
          SUM(valor_total_solicitado)::numeric as valor_total
        FROM reembolsos
        WHERE deleted_at IS NULL
          ${dataInicio ? sql`AND data_solicitacao >= ${dataInicio}::date` : sql``}
          ${dataFim ? sql`AND data_solicitacao <= ${dataFim}::date` : sql``}
          ${statusFilter ? sql`AND status = ${statusFilter}` : sql``}
        GROUP BY status
      `);

      // Query para reembolsos por categoria
      const reembolsosPorCategoria = await db.execute(sql`
        SELECT 
          ri.categoria,
          COUNT(DISTINCT ri.reembolso_id)::int as quantidade_reembolsos,
          SUM(ri.valor)::numeric as valor_total
        FROM reembolso_itens ri
        INNER JOIN reembolsos r ON r.id = ri.reembolso_id
        WHERE r.deleted_at IS NULL
          ${dataInicio ? sql`AND r.data_solicitacao >= ${dataInicio}::date` : sql``}
          ${dataFim ? sql`AND r.data_solicitacao <= ${dataFim}::date` : sql``}
        GROUP BY ri.categoria
        ORDER BY valor_total DESC
      `);

      // Query para despesas mensais (adiantamentos + reembolsos)
      const despesasMensais = await db.execute(sql`
        SELECT 
          TO_CHAR(data_solicitacao, 'YYYY-MM') as mes,
          'Adiantamentos' as tipo,
          SUM(valor_solicitado)::numeric as valor_total
        FROM adiantamentos
        WHERE deleted_at IS NULL
          ${dataInicio ? sql`AND data_solicitacao >= ${dataInicio}::date` : sql``}
          ${dataFim ? sql`AND data_solicitacao <= ${dataFim}::date` : sql``}
        GROUP BY TO_CHAR(data_solicitacao, 'YYYY-MM')
        
        UNION ALL
        
        SELECT 
          TO_CHAR(data_solicitacao, 'YYYY-MM') as mes,
          'Reembolsos' as tipo,
          SUM(valor_total_solicitado)::numeric as valor_total
        FROM reembolsos
        WHERE deleted_at IS NULL
          ${dataInicio ? sql`AND data_solicitacao >= ${dataInicio}::date` : sql``}
          ${dataFim ? sql`AND data_solicitacao <= ${dataFim}::date` : sql``}
        GROUP BY TO_CHAR(data_solicitacao, 'YYYY-MM')
        
        ORDER BY mes ASC
      `);

      // Query para top 10 colaboradores com mais despesas
      const topColaboradores = await db.execute(sql`
        SELECT 
          c.nome,
          c.departamento,
          COUNT(DISTINCT a.id) + COUNT(DISTINCT r.id) as total_solicitacoes,
          COALESCE(SUM(a.valor_solicitado), 0)::numeric + COALESCE(SUM(r.valor_total_solicitado), 0)::numeric as valor_total
        FROM colaboradores c
        LEFT JOIN adiantamentos a ON a.colaborador_id = c.id AND a.deleted_at IS NULL
          ${dataInicio ? sql`AND a.data_solicitacao >= ${dataInicio}::date` : sql``}
          ${dataFim ? sql`AND a.data_solicitacao <= ${dataFim}::date` : sql``}
        LEFT JOIN reembolsos r ON r.colaborador_id = c.id AND r.deleted_at IS NULL
          ${dataInicio ? sql`AND r.data_solicitacao >= ${dataInicio}::date` : sql``}
          ${dataFim ? sql`AND r.data_solicitacao <= ${dataFim}::date` : sql``}
        WHERE c.ativo = true
        GROUP BY c.id, c.nome, c.departamento
        HAVING COUNT(DISTINCT a.id) + COUNT(DISTINCT r.id) > 0
        ORDER BY valor_total DESC
        LIMIT 10
      `);

      res.json({
        adiantamentosPorStatus: adiantamentosPorStatus.rows,
        reembolsosPorStatus: reembolsosPorStatus.rows,
        reembolsosPorCategoria: reembolsosPorCategoria.rows,
        despesasMensais: despesasMensais.rows,
        topColaboradores: topColaboradores.rows,
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // ============================================================================
  // ADIANTAMENTOS
  // ============================================================================

  app.get("/api/adiantamentos", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const filters = {
        colaboradorId: colaborador.id,
        status: req.query.status as string,
        diretoria: req.query.diretoria as string,
        dataInicio: req.query.dataInicio as string,
        dataFim: req.query.dataFim as string,
      };

      const result = await storage.getAdiantamentos(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/adiantamentos", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const validated = insertAdiantamentoSchema.parse({
        ...req.body,
        colaboradorId: colaborador.id,
      });

      // Convert string dates to Date objects for database
      const dataToInsert = {
        ...validated,
        dataIda: new Date(validated.dataIda),
        dataVolta: new Date(validated.dataVolta),
      };

      const result = await storage.createAdiantamento(dataToInsert as any);
      
      // Send email notification to diretoria (fire-and-forget)
      const diretoriaEmails = await getEmailsByRole('Diretoria');
      emailService.sendAdiantamentoCreatedEmail(
        result,
        colaborador.email,
        diretoriaEmails
      ).catch(() => {}); // Fire-and-forget: errors logged internally
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/adiantamentos/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const adiantamento = await storage.getAdiantamentoById(id);
      if (!adiantamento) {
        return res.status(404).json({ message: "Adiantamento not found" });
      }

      // Check permissions: only owner can edit if status is Solicitado or Rejeitado, or admin
      const roles = await storage.getColaboradorRoles(colaborador.id);
      const userRoles = roles.map(r => r.role);
      const isAdmin = userRoles.includes("Administrador");
      const isOwner = adiantamento.colaboradorId === colaborador.id;
      
      const canEdit = isAdmin || 
        (isOwner && (adiantamento.status === "Solicitado" || adiantamento.status === "Rejeitado"));

      if (!canEdit) {
        return res.status(403).json({ 
          message: "Você não pode editar este adiantamento" 
        });
      }

      // Convert date strings to Date objects if present
      const updateData = { ...req.body, lastUpdatedBy: userId };
      if (updateData.dataIda && typeof updateData.dataIda === 'string') {
        updateData.dataIda = new Date(updateData.dataIda);
      }
      if (updateData.dataVolta && typeof updateData.dataVolta === 'string') {
        updateData.dataVolta = new Date(updateData.dataVolta);
      }
      if (updateData.dataPagamento && typeof updateData.dataPagamento === 'string') {
        updateData.dataPagamento = new Date(updateData.dataPagamento);
      }

      const updated = await storage.updateAdiantamento(id, updateData);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/adiantamentos/:id/approve-diretoria", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      const adiantamento = await storage.getAdiantamentoById(id);
      
      if (!adiantamento) {
        return res.status(404).json({ message: "Adiantamento not found" });
      }

      if (adiantamento.status !== "Solicitado") {
        return res.status(400).json({ message: "Invalid status for this operation" });
      }

      const updated = await storage.updateAdiantamento(id, {
        status: "AprovadoDiretoria",
        aprovacaoDiretoria: true,
        lastUpdatedBy: userId,
      });

      // Send email notification to financeiro and solicitante (fire-and-forget)
      if (updated) {
        const colaborador = await storage.getColaboradorById(updated.colaboradorId);
        const financeiroEmails = await getEmailsByRole('Financeiro');
        
        if (colaborador?.email) {
          emailService.sendAdiantamentoApprovedByDiretoriaEmail(
            updated,
            colaborador.email,
            financeiroEmails
          ).catch(() => {});
        }
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/adiantamentos/:id/approve-financeiro", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      const adiantamento = await storage.getAdiantamentoById(id);
      
      if (!adiantamento) {
        return res.status(404).json({ message: "Adiantamento not found" });
      }

      if (adiantamento.status !== "AprovadoDiretoria") {
        return res.status(400).json({ message: "Invalid status for this operation" });
      }

      const updated = await storage.updateAdiantamento(id, {
        status: "Pago",
        aprovacaoFinanceiro: true,
        dataPagamento: new Date(),
        formaPagamento: req.body.formaPagamento,
        lastUpdatedBy: userId,
      });

      // Send email notification to solicitante (fire-and-forget)
      if (updated) {
        const colaborador = await storage.getColaboradorById(updated.colaboradorId);
        if (colaborador?.email) {
          emailService.sendAdiantamentoApprovedByFinanceiroEmail(
            updated,
            colaborador.email
          ).catch(() => {});
        }
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/adiantamentos/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      const adiantamento = await storage.getAdiantamentoById(id);
      
      if (!adiantamento) {
        return res.status(404).json({ message: "Adiantamento not found" });
      }
      
      const updated = await storage.updateAdiantamento(id, {
        status: "Rejeitado",
        lastUpdatedBy: userId,
      });

      // Send email notification to solicitante (fire-and-forget)
      if (updated) {
        const colaborador = await storage.getColaboradorById(updated.colaboradorId);
        if (colaborador?.email) {
          // Determine who rejected based on previous status
          const rejectedBy = adiantamento.status === "Solicitado" ? 'Diretoria' : 'Financeiro';
          emailService.sendAdiantamentoRejectedEmail(
            updated,
            colaborador.email,
            rejectedBy,
            req.body.motivo
          ).catch(() => {});
        }
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/adiantamentos/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const adiantamento = await storage.getAdiantamentoById(id);
      if (!adiantamento) {
        return res.status(404).json({ message: "Adiantamento not found" });
      }

      // Check permissions
      const roles = await storage.getColaboradorRoles(colaborador.id);
      const userRoles = roles.map(r => r.role);
      const isAdmin = userRoles.includes("Administrador");
      const isOwner = adiantamento.colaboradorId === colaborador.id;

      // Only owner can delete if status is Solicitado or Rejeitado
      // Admins can delete anything except Pago or Concluído
      const canDelete = isAdmin || 
        (isOwner && (adiantamento.status === "Solicitado" || adiantamento.status === "Rejeitado"));

      if (!canDelete) {
        return res.status(403).json({ 
          message: "Não é possível excluir este adiantamento" 
        });
      }

      // Prevent deletion of paid/completed items
      if (adiantamento.status === "Pago" || adiantamento.status === "Concluído") {
        return res.status(400).json({ 
          message: "Não é possível excluir adiantamentos pagos ou concluídos" 
        });
      }

      const deleted = await storage.deleteAdiantamento(id, userId);
      res.json({ message: "Adiantamento excluído com sucesso", deleted });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // REEMBOLSOS
  // ============================================================================

  app.get("/api/reembolsos", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const filters = {
        colaboradorId: colaborador.id,
        status: req.query.status as string,
        centroCusto: req.query.centroCusto as string,
        dataInicio: req.query.dataInicio as string,
        dataFim: req.query.dataFim as string,
      };

      const result = await storage.getReembolsos(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/reembolsos", isAuthenticated, upload.any(), async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      // Extract files from multer
      const files = (req.files as Express.Multer.File[]) || [];
      
      // Extract itens and remove valorTotalSolicitado from request body
      // (server will calculate total from itens for security)
      let itens = req.body.itens;
      if (typeof itens === 'string') {
        itens = JSON.parse(itens);
      }
      
      const { valorTotalSolicitado, ...reembolsoData } = req.body;
      
      // Validate reembolso data (without valorTotalSolicitado)
      const validated = insertReembolsoSchema.omit({ valorTotalSolicitado: true }).parse({
        ...reembolsoData,
        colaboradorId: colaborador.id,
      });
      
      // Validate itens if provided
      const validatedItens: InsertReembolsoItem[] = [];
      if (itens && Array.isArray(itens) && itens.length > 0) {
        for (const item of itens) {
          // Parse without reembolsoId (will be added by storage)
          const { reembolsoId, hasNewFile, ...itemData } = item;
          
          // Convert date string to Date object
          if (itemData.dataDespesa && typeof itemData.dataDespesa === 'string') {
            itemData.dataDespesa = new Date(itemData.dataDespesa);
          }
          
          const validatedItem = insertReembolsoItemSchema
            .omit({ reembolsoId: true })
            .parse(itemData);
          validatedItens.push(validatedItem as InsertReembolsoItem);
        }
      }
      
      // Create reembolso and itens in a transaction with files
      const result = await storage.createReembolsoWithItens(validated, validatedItens, files);
      
      // Send email notification to diretoria (fire-and-forget)
      const diretoriaEmailsReembolso = await getEmailsByRole('Diretoria');
      emailService.sendReembolsoCreatedEmail(
        result,
        colaborador.email,
        diretoriaEmailsReembolso
      ).catch(() => {});
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/reembolsos/:id/approve-diretoria", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateReembolso(id, {
        status: "AprovadoDiretoria",
        aprovacaoDiretoria: true,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/reembolsos/:id/approve-financeiro", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateReembolso(id, {
        status: "Pago",
        aprovacaoFinanceiro: true,
        dataPagamento: new Date(),
        formaPagamento: req.body.formaPagamento,
      });

      // Send email notification to solicitante (fire-and-forget)
      if (updated) {
        const colaboradorReemb = await storage.getColaboradorById(updated.colaboradorId);
        if (colaboradorReemb?.email) {
          emailService.sendReembolsoApprovedEmail(
            updated,
            colaboradorReemb.email
          ).catch(() => {});
        }
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/reembolsos/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateReembolso(id, {
        status: "Rejeitado",
      });

      // Send email notification to solicitante (fire-and-forget)
      if (updated) {
        const colaboradorReembRej = await storage.getColaboradorById(updated.colaboradorId);
        if (colaboradorReembRej?.email) {
          emailService.sendReembolsoRejectedEmail(
            updated,
            colaboradorReembRej.email,
            req.body.motivo
          ).catch(() => {});
        }
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/reembolsos/:id", isAuthenticated, upload.any(), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const reembolso = await storage.getReembolsoById(id);
      if (!reembolso) {
        return res.status(404).json({ message: "Reembolso not found" });
      }

      // Check permissions
      const roles = await storage.getColaboradorRoles(colaborador.id);
      const userRoles = roles.map(r => r.role);
      const isAdmin = userRoles.includes("Administrador");
      const isOwner = reembolso.colaboradorId === colaborador.id;

      const canEdit = isAdmin || 
        (isOwner && (reembolso.status === "Solicitado" || reembolso.status === "Rejeitado"));

      if (!canEdit) {
        return res.status(403).json({ 
          message: "Não é possível editar este reembolso" 
        });
      }

      // Extract files from multer
      const files = (req.files as Express.Multer.File[]) || [];
      
      // Extract itens and parse if string (from FormData)
      let itens = req.body.itens;
      if (typeof itens === 'string') {
        itens = JSON.parse(itens);
      }
      
      const { valorTotalSolicitado, colaboradorId, ...reembolsoData } = req.body;
      
      // Convert date strings to Date objects if present
      if (reembolsoData.dataSolicitacao && typeof reembolsoData.dataSolicitacao === 'string') {
        reembolsoData.dataSolicitacao = new Date(reembolsoData.dataSolicitacao);
      }
      
      // Validate itens if provided
      const validatedItens: InsertReembolsoItem[] = [];
      if (itens && Array.isArray(itens) && itens.length > 0) {
        for (const item of itens) {
          const { reembolsoId, hasNewFile, ...itemData } = item;
          
          // Convert date strings to Date objects for items
          if (itemData.dataDespesa && typeof itemData.dataDespesa === 'string') {
            itemData.dataDespesa = new Date(itemData.dataDespesa);
          }
          
          const validatedItem = insertReembolsoItemSchema
            .omit({ reembolsoId: true })
            .parse(itemData);
          validatedItens.push(validatedItem as InsertReembolsoItem);
        }
      }
      
      // Update reembolso and itens in a transaction with files
      const result = await storage.updateReembolsoWithItens(id, reembolsoData, validatedItens, files);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/reembolsos/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const reembolso = await storage.getReembolsoById(id);
      if (!reembolso) {
        return res.status(404).json({ message: "Reembolso not found" });
      }

      // Check permissions
      const roles = await storage.getColaboradorRoles(colaborador.id);
      const userRoles = roles.map(r => r.role);
      const isAdmin = userRoles.includes("Administrador");
      const isOwner = reembolso.colaboradorId === colaborador.id;

      const canDelete = isAdmin || 
        (isOwner && (reembolso.status === "Solicitado" || reembolso.status === "Rejeitado"));

      if (!canDelete) {
        return res.status(403).json({ 
          message: "Não é possível excluir este reembolso" 
        });
      }

      if (reembolso.status === "Pago" || reembolso.status === "Concluído") {
        return res.status(400).json({ 
          message: "Não é possível excluir reembolsos pagos ou concluídos" 
        });
      }

      const deleted = await storage.deleteReembolso(id, userId);
      res.json({ message: "Reembolso excluído com sucesso", deleted });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // PASSAGENS AÉREAS
  // ============================================================================

  app.get("/api/passagens", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const result = await storage.getPassagensAereas({
        colaboradorId: colaborador.id,
        status: req.query.status as string,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/passagens", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const validated = insertPassagemAereaSchema.parse({
        ...req.body,
        colaboradorId: colaborador.id,
      });

      // Convert string dates to Date objects for database
      const dataToInsert = {
        ...validated,
        dataIda: new Date(validated.dataIda),
        dataVolta: validated.dataVolta ? new Date(validated.dataVolta) : undefined,
      };

      const result = await storage.createPassagemAerea(dataToInsert as any);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/passagens/:id/approve-diretoria", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updatePassagemAerea(id, {
        status: "AprovadoDiretoria",
        aprovacaoDiretoria: true,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/passagens/:id/approve-financeiro", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updatePassagemAerea(id, {
        status: "Emitido",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/passagens/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updatePassagemAerea(id, {
        status: "Rejeitado",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/passagens/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) return res.status(404).json({ message: "Colaborador not found" });

      const passagem = await storage.getPassagemAereaById(id);
      if (!passagem) return res.status(404).json({ message: "Passagem not found" });

      const roles = await storage.getColaboradorRoles(colaborador.id);
      const isAdmin = roles.some(r => r.role === "Administrador");
      const isOwner = passagem.colaboradorId === colaborador.id;
      
      const canEdit = isAdmin || (isOwner && (passagem.status === "Solicitado" || passagem.status === "Rejeitado"));
      if (!canEdit) return res.status(403).json({ message: "Você não pode editar esta passagem" });

      // Validar dados (sem colaboradorId no payload, será preservado do registro existente)
      const dataToUpdate: any = { ...req.body };
      if (dataToUpdate.dataIda) dataToUpdate.dataIda = new Date(dataToUpdate.dataIda);
      if (dataToUpdate.dataVolta) dataToUpdate.dataVolta = new Date(dataToUpdate.dataVolta);
      delete dataToUpdate.colaboradorId; // Segurança: não permitir alteração do colaboradorId

      const updated = await storage.updatePassagemAerea(id, dataToUpdate as any);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/passagens/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const passagem = await storage.getPassagemAereaById(id);
      if (!passagem) {
        return res.status(404).json({ message: "Passagem not found" });
      }

      const roles = await storage.getColaboradorRoles(colaborador.id);
      const userRoles = roles.map(r => r.role);
      const isAdmin = userRoles.includes("Administrador");
      const isOwner = passagem.colaboradorId === colaborador.id;

      const canDelete = isAdmin || 
        (isOwner && (passagem.status === "Solicitado" || passagem.status === "Rejeitado"));

      if (!canDelete) {
        return res.status(403).json({ 
          message: "Não é possível excluir esta passagem" 
        });
      }

      if (passagem.status === "Emitido") {
        return res.status(400).json({ 
          message: "Não é possível excluir passagens já emitidas" 
        });
      }

      const deleted = await storage.deletePassagemAerea(id, userId);
      res.json({ message: "Passagem excluída com sucesso", deleted });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // HOSPEDAGENS
  // ============================================================================

  app.get("/api/hospedagens", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const result = await storage.getHospedagens({
        colaboradorId: colaborador.id,
        status: req.query.status as string,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/hospedagens", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const validated = insertHospedagemSchema.parse({
        ...req.body,
        colaboradorId: colaborador.id,
      });

      // Convert string dates to Date objects for database
      const dataToInsert = {
        ...validated,
        dataCheckin: new Date(validated.dataCheckin),
        dataCheckout: new Date(validated.dataCheckout),
      };

      const result = await storage.createHospedagem(dataToInsert as any);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/hospedagens/:id/approve-diretoria", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateHospedagem(id, {
        status: "AprovadoDiretoria",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/hospedagens/:id/approve-financeiro", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateHospedagem(id, {
        status: "Confirmado",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/hospedagens/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateHospedagem(id, {
        status: "Rejeitado",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/hospedagens/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const hospedagem = await storage.getHospedagemById(id);
      if (!hospedagem) {
        return res.status(404).json({ message: "Hospedagem not found" });
      }

      const roles = await storage.getColaboradorRoles(colaborador.id);
      const userRoles = roles.map(r => r.role);
      const isAdmin = userRoles.includes("Administrador");
      const isOwner = hospedagem.colaboradorId === colaborador.id;

      const canDelete = isAdmin || 
        (isOwner && (hospedagem.status === "Solicitado" || hospedagem.status === "Rejeitado"));

      if (!canDelete) {
        return res.status(403).json({ 
          message: "Não é possível excluir esta hospedagem" 
        });
      }

      if (hospedagem.status === "Confirmado") {
        return res.status(400).json({ 
          message: "Não é possível excluir hospedagens já confirmadas" 
        });
      }

      const deleted = await storage.deleteHospedagem(id, userId);
      res.json({ message: "Hospedagem excluída com sucesso", deleted });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // VIAGENS EXECUTADAS
  // ============================================================================

  app.get("/api/viagens-executadas", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const result = await storage.getViagensExecutadas({
        colaboradorId: colaborador.id,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/viagens-executadas", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const validated = insertViagemExecutadaSchema.parse({
        ...req.body,
        colaboradorId: colaborador.id,
      });

      // Convert string dates to Date objects for database
      const dataToInsert = {
        ...validated,
        dataVoo: validated.dataVoo ? new Date(validated.dataVoo) : undefined,
      };

      const result = await storage.createViagemExecutada(dataToInsert as any);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/viagens-executadas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const viagem = await storage.getViagemExecutadaById(id);
      if (!viagem) {
        return res.status(404).json({ message: "Viagem executada not found" });
      }

      const roles = await storage.getColaboradorRoles(colaborador.id);
      const userRoles = roles.map(r => r.role);
      const isAdmin = userRoles.includes("Administrador");
      const isOwner = viagem.colaboradorId === colaborador.id;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ 
          message: "Não é possível excluir esta viagem executada" 
        });
      }

      const deleted = await storage.deleteViagemExecutada(id, userId);
      res.json({ message: "Viagem executada excluída com sucesso", deleted });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // HOSPEDAGENS EXECUTADAS
  // ============================================================================

  app.get("/api/hospedagens-executadas", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const result = await storage.getHospedagensExecutadas({
        colaboradorId: colaborador.id,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/hospedagens-executadas", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const validated = insertHospedagemExecutadaSchema.parse({
        ...req.body,
        colaboradorId: colaborador.id,
      });

      // Convert string dates to Date objects for database
      const dataToInsert = {
        ...validated,
        dataHospedagem: validated.dataHospedagem ? new Date(validated.dataHospedagem) : undefined,
      };

      const result = await storage.createHospedagemExecutada(dataToInsert as any);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/hospedagens-executadas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const hospedagem = await storage.getHospedagemExecutadaById(id);
      if (!hospedagem) {
        return res.status(404).json({ message: "Hospedagem executada not found" });
      }

      const roles = await storage.getColaboradorRoles(colaborador.id);
      const userRoles = roles.map(r => r.role);
      const isAdmin = userRoles.includes("Administrador");
      const isOwner = hospedagem.colaboradorId === colaborador.id;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ 
          message: "Não é possível excluir esta hospedagem executada" 
        });
      }

      const deleted = await storage.deleteHospedagemExecutada(id, userId);
      res.json({ message: "Hospedagem executada excluída com sucesso", deleted });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // PRESTAÇÃO DE ADIANTAMENTO
  // ============================================================================

  app.get("/api/prestacao-adiantamento", isAuthenticated, async (req, res) => {
    try {
      // Fetch all prestações - for now we'll do this via adiantamentos
      // In future this could be optimized with a dedicated query
      const prestacoes: any[] = [];
      res.json(prestacoes);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/prestacao-adiantamento/by-adiantamento/:adiantamentoId", isAuthenticated, async (req, res) => {
    try {
      const adiantamentoId = parseInt(req.params.adiantamentoId);
      const prestacao = await storage.getPrestacaoAdiantamentoByAdiantamentoId(adiantamentoId);
      if (!prestacao) {
        return res.status(404).json({ message: "Prestação not found" });
      }
      res.json(prestacao);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/prestacao-adiantamento", isAuthenticated, async (req, res) => {
    try {
      // Extract itens from request body
      const { itens, ...prestacaoData } = req.body;
      
      // Validate prestação data
      const validated = insertPrestacaoAdiantamentoSchema.parse(prestacaoData);
      
      // Validate itens if provided
      const validatedItens: InsertPrestacaoAdiantamentoItem[] = [];
      if (itens && Array.isArray(itens) && itens.length > 0) {
        for (const item of itens) {
          // Parse without prestacaoAdiantamentoId (will be added by storage)
          const { prestacaoAdiantamentoId, ...itemData } = item;
          const validatedItem = insertPrestacaoAdiantamentoItemSchema
            .omit({ prestacaoAdiantamentoId: true })
            .parse(itemData);
          validatedItens.push(validatedItem as InsertPrestacaoAdiantamentoItem);
        }
      }
      
      // Create prestação and itens in a transaction
      const result = await storage.createPrestacaoAdiantamentoWithItens(validated, validatedItens);
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/prestacao-adiantamento/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const prestacao = await storage.getPrestacaoAdiantamentoById(id);
      if (!prestacao) {
        return res.status(404).json({ message: "Prestação not found" });
      }

      // Get the related adiantamento to check ownership
      const adiantamento = await storage.getAdiantamentoById(prestacao.adiantamentoId);
      if (!adiantamento) {
        return res.status(404).json({ message: "Adiantamento relacionado não encontrado" });
      }

      const roles = await storage.getColaboradorRoles(colaborador.id);
      const userRoles = roles.map(r => r.role);
      const isAdmin = userRoles.includes("Administrador");
      const isOwner = adiantamento.colaboradorId === colaborador.id;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ 
          message: "Não é possível excluir esta prestação de adiantamento" 
        });
      }

      const deleted = await storage.deletePrestacaoAdiantamento(id, userId);
      res.json({ message: "Prestação de adiantamento excluída com sucesso", deleted });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // ITENS DE DESPESA DA PRESTAÇÃO DE ADIANTAMENTO
  // ============================================================================

  // GET all itens de despesa for a prestação
  app.get("/api/prestacao-adiantamento/:id/itens", isAuthenticated, async (req, res) => {
    try {
      const prestacaoId = parseInt(req.params.id);
      const itens = await storage.getPrestacaoAdiantamentoItens(prestacaoId);
      res.json(itens);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // POST create new item de despesa
  app.post("/api/prestacao-adiantamento/:id/itens", isAuthenticated, async (req, res) => {
    try {
      const prestacaoId = parseInt(req.params.id);
      const validated = insertPrestacaoAdiantamentoItemSchema.parse({
        ...req.body,
        prestacaoAdiantamentoId: prestacaoId,
      });
      const result = await storage.createPrestacaoAdiantamentoItem(validated);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // PATCH update item de despesa
  app.patch("/api/prestacao-adiantamento/itens/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const result = await storage.updatePrestacaoAdiantamentoItem(itemId, req.body);
      if (!result) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // DELETE item de despesa
  app.delete("/api/prestacao-adiantamento/itens/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await storage.deletePrestacaoAdiantamentoItem(itemId);
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // ITENS DE DESPESA DO REEMBOLSO
  // ============================================================================

  // GET all itens de despesa for a reembolso
  app.get("/api/reembolsos/:id/itens", isAuthenticated, async (req, res) => {
    try {
      const reembolsoId = parseInt(req.params.id);
      const itens = await storage.getReembolsoItens(reembolsoId);
      res.json(itens);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // POST create new item de despesa
  app.post("/api/reembolsos/:id/itens", isAuthenticated, async (req, res) => {
    try {
      const reembolsoId = parseInt(req.params.id);
      const validated = insertReembolsoItemSchema.parse({
        ...req.body,
        reembolsoId: reembolsoId,
      });
      const result = await storage.createReembolsoItem(validated);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // PATCH update item de despesa
  app.patch("/api/reembolsos/itens/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const result = await storage.updateReembolsoItem(itemId, req.body);
      if (!result) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // DELETE item de despesa
  app.delete("/api/reembolsos/itens/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await storage.deleteReembolsoItem(itemId);
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // RELATÓRIOS PDF
  // ============================================================================

  // GET PDF report for adiantamento prestação
  app.get("/api/prestacao-adiantamento/:id/relatorio", isAuthenticated, async (req, res) => {
    try {
      const prestacaoId = parseInt(req.params.id);
      
      // Fetch prestação
      const prestacao = await storage.getPrestacaoAdiantamentoById(prestacaoId);
      if (!prestacao) {
        return res.status(404).json({ message: "Prestação not found" });
      }

      // Fetch items
      const itens = await storage.getPrestacaoAdiantamentoItens(prestacaoId);

      // Fetch adiantamento
      const adiantamento = await storage.getAdiantamentoById(prestacao.adiantamentoId);
      if (!adiantamento) {
        return res.status(404).json({ message: "Adiantamento not found" });
      }

      // Fetch colaborador
      const colaborador = await storage.getColaboradorById(adiantamento.colaboradorId);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      // Generate PDF
      const { generateAdiantamentoReport } = await import("./pdfGenerator");
      const doc = generateAdiantamentoReport({
        prestacao,
        itens,
        adiantamento,
        colaborador,
      });

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="prestacao-adiantamento-${prestacaoId}.pdf"`
      );

      // Pipe PDF to response
      doc.pipe(res);
      doc.end();
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // GET PDF report for reembolso
  app.get("/api/reembolsos/:id/relatorio", isAuthenticated, async (req, res) => {
    try {
      const reembolsoId = parseInt(req.params.id);
      
      // Fetch reembolso
      const reembolso = await storage.getReembolsoById(reembolsoId);
      if (!reembolso) {
        return res.status(404).json({ message: "Reembolso not found" });
      }

      // Fetch items
      const itens = await storage.getReembolsoItens(reembolsoId);

      // Fetch colaborador
      const colaborador = await storage.getColaboradorById(reembolso.colaboradorId);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      // Generate PDF
      const { generateReembolsoReport } = await import("./pdfGenerator");
      const doc = generateReembolsoReport({
        reembolso,
        itens,
        colaborador,
      });

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="reembolso-${reembolsoId}.pdf"`
      );

      // Pipe PDF to response
      doc.pipe(res);
      doc.end();
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
