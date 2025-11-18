import { db } from "./db";
import {
  users,
  colaboradores,
  colaboradorRoles,
  adiantamentos,
  prestacaoAdiantamento,
  prestacaoAdiantamentoItens,
  reembolsos,
  prestacaoReembolso,
  prestacaoReembolsoItens,
  passagensAereas,
  hospedagens,
  viagensExecutadas,
  hospedagensExecutadas,
  type User,
  type UpsertUser,
  type Colaborador,
  type InsertColaborador,
  type ColaboradorRole,
  type InsertColaboradorRole,
  type Adiantamento,
  type InsertAdiantamento,
  type PrestacaoAdiantamento,
  type InsertPrestacaoAdiantamento,
  type PrestacaoAdiantamentoItem,
  type InsertPrestacaoAdiantamentoItem,
  type Reembolso,
  type InsertReembolso,
  type PrestacaoReembolso,
  type InsertPrestacaoReembolso,
  type PrestacaoReembolsoItem,
  type InsertPrestacaoReembolsoItem,
  type PassagemAerea,
  type InsertPassagemAerea,
  type Hospedagem,
  type InsertHospedagem,
  type ViagemExecutada,
  type InsertViagemExecutada,
  type HospedagemExecutada,
  type InsertHospedagemExecutada,
} from "@shared/schema";
import { eq, and, gte, lte, like, desc } from "drizzle-orm";

export interface IStorage {
  // Users (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Colaboradores
  getColaboradores(): Promise<Colaborador[]>;
  getColaboradorById(id: number): Promise<Colaborador | undefined>;
  getColaboradorByUserId(userId: string): Promise<Colaborador | undefined>;
  createColaborador(data: InsertColaborador): Promise<Colaborador>;
  updateColaborador(id: number, data: Partial<InsertColaborador>): Promise<Colaborador | undefined>;

  // Roles
  getColaboradorRoles(colaboradorId: number): Promise<ColaboradorRole[]>;
  addColaboradorRole(data: InsertColaboradorRole): Promise<ColaboradorRole>;
  removeColaboradorRole(id: number): Promise<void>;

  // Adiantamentos
  getAdiantamentos(filters?: {
    colaboradorId?: number;
    status?: string;
    diretoria?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<Adiantamento[]>;
  getAdiantamentoById(id: number): Promise<Adiantamento | undefined>;
  createAdiantamento(data: InsertAdiantamento): Promise<Adiantamento>;
  updateAdiantamento(id: number, data: Partial<Adiantamento>): Promise<Adiantamento | undefined>;

  // Prestação de Adiantamento
  getPrestacaoAdiantamentoById(id: number): Promise<PrestacaoAdiantamento | undefined>;
  getPrestacaoAdiantamentoByAdiantamentoId(adiantamentoId: number): Promise<PrestacaoAdiantamento | undefined>;
  createPrestacaoAdiantamento(data: InsertPrestacaoAdiantamento): Promise<PrestacaoAdiantamento>;
  updatePrestacaoAdiantamento(id: number, data: Partial<PrestacaoAdiantamento>): Promise<PrestacaoAdiantamento | undefined>;

  // Itens de Despesa da Prestação de Adiantamento
  getPrestacaoAdiantamentoItens(prestacaoAdiantamentoId: number): Promise<PrestacaoAdiantamentoItem[]>;
  createPrestacaoAdiantamentoItem(data: InsertPrestacaoAdiantamentoItem): Promise<PrestacaoAdiantamentoItem>;
  updatePrestacaoAdiantamentoItem(id: number, data: Partial<PrestacaoAdiantamentoItem>): Promise<PrestacaoAdiantamentoItem | undefined>;
  deletePrestacaoAdiantamentoItem(id: number): Promise<void>;

  // Reembolsos
  getReembolsos(filters?: {
    colaboradorId?: number;
    status?: string;
    centroCusto?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<Reembolso[]>;
  getReembolsoById(id: number): Promise<Reembolso | undefined>;
  createReembolso(data: InsertReembolso): Promise<Reembolso>;
  updateReembolso(id: number, data: Partial<Reembolso>): Promise<Reembolso | undefined>;

  // Prestação de Reembolso
  getPrestacaoReembolsoById(id: number): Promise<PrestacaoReembolso | undefined>;
  getPrestacaoReembolsoByReembolsoId(reembolsoId: number): Promise<PrestacaoReembolso | undefined>;
  createPrestacaoReembolso(data: InsertPrestacaoReembolso): Promise<PrestacaoReembolso>;
  updatePrestacaoReembolso(id: number, data: Partial<PrestacaoReembolso>): Promise<PrestacaoReembolso | undefined>;

  // Passagens Aéreas
  getPassagensAereas(filters?: {
    colaboradorId?: number;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<PassagemAerea[]>;
  getPassagemAereaById(id: number): Promise<PassagemAerea | undefined>;
  createPassagemAerea(data: InsertPassagemAerea): Promise<PassagemAerea>;
  updatePassagemAerea(id: number, data: Partial<PassagemAerea>): Promise<PassagemAerea | undefined>;

  // Hospedagens
  getHospedagens(filters?: {
    colaboradorId?: number;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<Hospedagem[]>;
  getHospedagemById(id: number): Promise<Hospedagem | undefined>;
  createHospedagem(data: InsertHospedagem): Promise<Hospedagem>;
  updateHospedagem(id: number, data: Partial<Hospedagem>): Promise<Hospedagem | undefined>;

  // Viagens Executadas
  getViagensExecutadas(filters?: {
    colaboradorId?: number;
    centroCusto?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<ViagemExecutada[]>;
  getViagemExecutadaById(id: number): Promise<ViagemExecutada | undefined>;
  createViagemExecutada(data: InsertViagemExecutada): Promise<ViagemExecutada>;
  updateViagemExecutada(id: number, data: Partial<ViagemExecutada>): Promise<ViagemExecutada | undefined>;

  // Hospedagens Executadas
  getHospedagensExecutadas(filters?: {
    colaboradorId?: number;
    centroCusto?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<HospedagemExecutada[]>;
  getHospedagemExecutadaById(id: number): Promise<HospedagemExecutada | undefined>;
  createHospedagemExecutada(data: InsertHospedagemExecutada): Promise<HospedagemExecutada>;
  updateHospedagemExecutada(id: number, data: Partial<HospedagemExecutada>): Promise<HospedagemExecutada | undefined>;

  // Dashboard Stats
  getDashboardStats(colaboradorId?: number): Promise<{
    adiantamentos: { total: number; valorTotal: number };
    reembolsos: { total: number; valorTotal: number };
    viagens: { total: number };
    passagens: { total: number };
  }>;
}

export class DatabaseStorage implements IStorage {
  // ============================================================================
  // USERS (for Replit Auth)
  // ============================================================================

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // ============================================================================
  // COLABORADORES
  // ============================================================================
  
  async getColaboradores(): Promise<Colaborador[]> {
    return await db.select().from(colaboradores);
  }

  async getColaboradorById(id: number): Promise<Colaborador | undefined> {
    const result = await db.select().from(colaboradores).where(eq(colaboradores.id, id));
    return result[0];
  }

  async getColaboradorByUserId(userId: string): Promise<Colaborador | undefined> {
    const result = await db.select().from(colaboradores).where(eq(colaboradores.userId, userId));
    return result[0];
  }

  async createColaborador(data: InsertColaborador): Promise<Colaborador> {
    const result = await db.insert(colaboradores).values(data).returning();
    return result[0];
  }

  async updateColaborador(id: number, data: Partial<InsertColaborador>): Promise<Colaborador | undefined> {
    const result = await db
      .update(colaboradores)
      .set(data)
      .where(eq(colaboradores.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // ROLES
  // ============================================================================

  async getColaboradorRoles(colaboradorId: number): Promise<ColaboradorRole[]> {
    return await db.select().from(colaboradorRoles).where(eq(colaboradorRoles.colaboradorId, colaboradorId));
  }

  async addColaboradorRole(data: InsertColaboradorRole): Promise<ColaboradorRole> {
    const result = await db.insert(colaboradorRoles).values(data).returning();
    return result[0];
  }

  async removeColaboradorRole(id: number): Promise<void> {
    await db.delete(colaboradorRoles).where(eq(colaboradorRoles.id, id));
  }

  // ============================================================================
  // ADIANTAMENTOS
  // ============================================================================

  async getAdiantamentos(filters?: {
    colaboradorId?: number;
    status?: string;
    diretoria?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<Adiantamento[]> {
    let query = db.select().from(adiantamentos).orderBy(desc(adiantamentos.dataSolicitacao));
    
    const conditions = [];
    if (filters?.colaboradorId) {
      conditions.push(eq(adiantamentos.colaboradorId, filters.colaboradorId));
    }
    if (filters?.status) {
      conditions.push(eq(adiantamentos.status, filters.status));
    }
    if (filters?.diretoria) {
      conditions.push(like(adiantamentos.diretoriaResponsavel, `%${filters.diretoria}%`));
    }
    if (filters?.dataInicio) {
      conditions.push(gte(adiantamentos.dataIda, new Date(filters.dataInicio)));
    }
    if (filters?.dataFim) {
      conditions.push(lte(adiantamentos.dataVolta, new Date(filters.dataFim)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async getAdiantamentoById(id: number): Promise<Adiantamento | undefined> {
    const result = await db.select().from(adiantamentos).where(eq(adiantamentos.id, id));
    return result[0];
  }

  async createAdiantamento(data: InsertAdiantamento): Promise<Adiantamento> {
    const result = await db.insert(adiantamentos).values(data).returning();
    return result[0];
  }

  async updateAdiantamento(id: number, data: Partial<Adiantamento>): Promise<Adiantamento | undefined> {
    const result = await db
      .update(adiantamentos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adiantamentos.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // PRESTAÇÃO DE ADIANTAMENTO
  // ============================================================================

  async getPrestacaoAdiantamentoById(id: number): Promise<PrestacaoAdiantamento | undefined> {
    const result = await db
      .select()
      .from(prestacaoAdiantamento)
      .where(eq(prestacaoAdiantamento.id, id));
    return result[0];
  }

  async getPrestacaoAdiantamentoByAdiantamentoId(adiantamentoId: number): Promise<PrestacaoAdiantamento | undefined> {
    const result = await db
      .select()
      .from(prestacaoAdiantamento)
      .where(eq(prestacaoAdiantamento.adiantamentoId, adiantamentoId));
    return result[0];
  }

  async createPrestacaoAdiantamento(data: InsertPrestacaoAdiantamento): Promise<PrestacaoAdiantamento> {
    const result = await db.insert(prestacaoAdiantamento).values(data).returning();
    return result[0];
  }

  // Create prestação with itens in a single transaction
  async createPrestacaoAdiantamentoWithItens(
    prestacaoData: InsertPrestacaoAdiantamento,
    itens: InsertPrestacaoAdiantamentoItem[]
  ): Promise<{ prestacao: PrestacaoAdiantamento; itens: PrestacaoAdiantamentoItem[] }> {
    return await db.transaction(async (tx) => {
      // Create prestação
      const [prestacao] = await tx.insert(prestacaoAdiantamento).values(prestacaoData).returning();
      
      // Create itens if provided
      const createdItens: PrestacaoAdiantamentoItem[] = [];
      if (itens && itens.length > 0) {
        for (const item of itens) {
          const [createdItem] = await tx
            .insert(prestacaoAdiantamentoItens)
            .values({ ...item, prestacaoAdiantamentoId: prestacao.id })
            .returning();
          createdItens.push(createdItem);
        }
      }
      
      return { prestacao, itens: createdItens };
    });
  }

  async updatePrestacaoAdiantamento(id: number, data: Partial<PrestacaoAdiantamento>): Promise<PrestacaoAdiantamento | undefined> {
    const result = await db
      .update(prestacaoAdiantamento)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prestacaoAdiantamento.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // ITENS DE DESPESA DA PRESTAÇÃO DE ADIANTAMENTO
  // ============================================================================

  async getPrestacaoAdiantamentoItens(prestacaoAdiantamentoId: number): Promise<PrestacaoAdiantamentoItem[]> {
    return await db
      .select()
      .from(prestacaoAdiantamentoItens)
      .where(eq(prestacaoAdiantamentoItens.prestacaoAdiantamentoId, prestacaoAdiantamentoId))
      .orderBy(prestacaoAdiantamentoItens.id);
  }

  async createPrestacaoAdiantamentoItem(data: InsertPrestacaoAdiantamentoItem): Promise<PrestacaoAdiantamentoItem> {
    const result = await db.insert(prestacaoAdiantamentoItens).values(data).returning();
    return result[0];
  }

  async updatePrestacaoAdiantamentoItem(id: number, data: Partial<PrestacaoAdiantamentoItem>): Promise<PrestacaoAdiantamentoItem | undefined> {
    const result = await db
      .update(prestacaoAdiantamentoItens)
      .set(data)
      .where(eq(prestacaoAdiantamentoItens.id, id))
      .returning();
    return result[0];
  }

  async deletePrestacaoAdiantamentoItem(id: number): Promise<void> {
    await db.delete(prestacaoAdiantamentoItens).where(eq(prestacaoAdiantamentoItens.id, id));
  }

  // ============================================================================
  // REEMBOLSOS
  // ============================================================================

  async getReembolsos(filters?: {
    colaboradorId?: number;
    status?: string;
    centroCusto?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<Reembolso[]> {
    let query = db.select().from(reembolsos).orderBy(desc(reembolsos.dataSolicitacao));
    
    const conditions = [];
    if (filters?.colaboradorId) {
      conditions.push(eq(reembolsos.colaboradorId, filters.colaboradorId));
    }
    if (filters?.status) {
      conditions.push(eq(reembolsos.status, filters.status));
    }
    if (filters?.centroCusto) {
      conditions.push(like(reembolsos.centroCusto, `%${filters.centroCusto}%`));
    }
    if (filters?.dataInicio) {
      conditions.push(gte(reembolsos.dataSolicitacao, new Date(filters.dataInicio)));
    }
    if (filters?.dataFim) {
      conditions.push(lte(reembolsos.dataSolicitacao, new Date(filters.dataFim)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async getReembolsoById(id: number): Promise<Reembolso | undefined> {
    const result = await db.select().from(reembolsos).where(eq(reembolsos.id, id));
    return result[0];
  }

  async createReembolso(data: InsertReembolso): Promise<Reembolso> {
    const result = await db.insert(reembolsos).values(data).returning();
    return result[0];
  }

  async updateReembolso(id: number, data: Partial<Reembolso>): Promise<Reembolso | undefined> {
    const result = await db
      .update(reembolsos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reembolsos.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // PRESTAÇÃO DE REEMBOLSO
  // ============================================================================

  async getPrestacaoReembolsoById(id: number): Promise<PrestacaoReembolso | undefined> {
    const result = await db
      .select()
      .from(prestacaoReembolso)
      .where(eq(prestacaoReembolso.id, id));
    return result[0];
  }

  async getPrestacaoReembolsoByReembolsoId(reembolsoId: number): Promise<PrestacaoReembolso | undefined> {
    const result = await db
      .select()
      .from(prestacaoReembolso)
      .where(eq(prestacaoReembolso.reembolsoId, reembolsoId));
    return result[0];
  }

  async createPrestacaoReembolso(data: InsertPrestacaoReembolso): Promise<PrestacaoReembolso> {
    const result = await db.insert(prestacaoReembolso).values(data).returning();
    return result[0];
  }

  async updatePrestacaoReembolso(id: number, data: Partial<PrestacaoReembolso>): Promise<PrestacaoReembolso | undefined> {
    const result = await db
      .update(prestacaoReembolso)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prestacaoReembolso.id, id))
      .returning();
    return result[0];
  }

  // Create prestação with itens in a single transaction
  async createPrestacaoReembolsoWithItens(
    prestacaoData: InsertPrestacaoReembolso,
    itens: InsertPrestacaoReembolsoItem[]
  ): Promise<{ prestacao: PrestacaoReembolso; itens: PrestacaoReembolsoItem[] }> {
    return await db.transaction(async (tx) => {
      // Create prestação
      const [prestacao] = await tx.insert(prestacaoReembolso).values(prestacaoData).returning();
      
      // Create itens if provided
      const createdItens: PrestacaoReembolsoItem[] = [];
      if (itens && itens.length > 0) {
        for (const item of itens) {
          const [createdItem] = await tx
            .insert(prestacaoReembolsoItens)
            .values({ ...item, prestacaoReembolsoId: prestacao.id })
            .returning();
          createdItens.push(createdItem);
        }
      }
      
      return { prestacao, itens: createdItens };
    });
  }

  // ============================================================================
  // ITENS DE DESPESA DA PRESTAÇÃO DE REEMBOLSO
  // ============================================================================

  async getPrestacaoReembolsoItens(prestacaoReembolsoId: number): Promise<PrestacaoReembolsoItem[]> {
    return await db
      .select()
      .from(prestacaoReembolsoItens)
      .where(eq(prestacaoReembolsoItens.prestacaoReembolsoId, prestacaoReembolsoId))
      .orderBy(prestacaoReembolsoItens.id);
  }

  async createPrestacaoReembolsoItem(data: InsertPrestacaoReembolsoItem): Promise<PrestacaoReembolsoItem> {
    const result = await db.insert(prestacaoReembolsoItens).values(data).returning();
    return result[0];
  }

  async updatePrestacaoReembolsoItem(id: number, data: Partial<PrestacaoReembolsoItem>): Promise<PrestacaoReembolsoItem | undefined> {
    const result = await db
      .update(prestacaoReembolsoItens)
      .set(data)
      .where(eq(prestacaoReembolsoItens.id, id))
      .returning();
    return result[0];
  }

  async deletePrestacaoReembolsoItem(id: number): Promise<void> {
    await db.delete(prestacaoReembolsoItens).where(eq(prestacaoReembolsoItens.id, id));
  }

  // ============================================================================
  // PASSAGENS AÉREAS
  // ============================================================================

  async getPassagensAereas(filters?: {
    colaboradorId?: number;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<PassagemAerea[]> {
    let query = db.select().from(passagensAereas).orderBy(desc(passagensAereas.dataSolicitacao));
    
    const conditions = [];
    if (filters?.colaboradorId) {
      conditions.push(eq(passagensAereas.colaboradorId, filters.colaboradorId));
    }
    if (filters?.status) {
      conditions.push(eq(passagensAereas.status, filters.status));
    }
    if (filters?.dataInicio) {
      conditions.push(gte(passagensAereas.dataIda, new Date(filters.dataInicio)));
    }
    if (filters?.dataFim && filters.dataFim !== "") {
      conditions.push(lte(passagensAereas.dataVolta, new Date(filters.dataFim)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async getPassagemAereaById(id: number): Promise<PassagemAerea | undefined> {
    const result = await db.select().from(passagensAereas).where(eq(passagensAereas.id, id));
    return result[0];
  }

  async createPassagemAerea(data: InsertPassagemAerea): Promise<PassagemAerea> {
    const result = await db.insert(passagensAereas).values(data).returning();
    return result[0];
  }

  async updatePassagemAerea(id: number, data: Partial<PassagemAerea>): Promise<PassagemAerea | undefined> {
    const result = await db
      .update(passagensAereas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(passagensAereas.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // HOSPEDAGENS
  // ============================================================================

  async getHospedagens(filters?: {
    colaboradorId?: number;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<Hospedagem[]> {
    let query = db.select().from(hospedagens).orderBy(desc(hospedagens.dataSolicitacao));
    
    const conditions = [];
    if (filters?.colaboradorId) {
      conditions.push(eq(hospedagens.colaboradorId, filters.colaboradorId));
    }
    if (filters?.status) {
      conditions.push(eq(hospedagens.status, filters.status));
    }
    if (filters?.dataInicio) {
      conditions.push(gte(hospedagens.dataCheckin, new Date(filters.dataInicio)));
    }
    if (filters?.dataFim) {
      conditions.push(lte(hospedagens.dataCheckout, new Date(filters.dataFim)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async getHospedagemById(id: number): Promise<Hospedagem | undefined> {
    const result = await db.select().from(hospedagens).where(eq(hospedagens.id, id));
    return result[0];
  }

  async createHospedagem(data: InsertHospedagem): Promise<Hospedagem> {
    const result = await db.insert(hospedagens).values(data).returning();
    return result[0];
  }

  async updateHospedagem(id: number, data: Partial<Hospedagem>): Promise<Hospedagem | undefined> {
    const result = await db
      .update(hospedagens)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(hospedagens.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // VIAGENS EXECUTADAS
  // ============================================================================

  async getViagensExecutadas(filters?: {
    colaboradorId?: number;
    centroCusto?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<ViagemExecutada[]> {
    let query = db.select().from(viagensExecutadas).orderBy(desc(viagensExecutadas.emissao));
    
    const conditions = [];
    if (filters?.colaboradorId) {
      conditions.push(eq(viagensExecutadas.colaboradorId, filters.colaboradorId));
    }
    if (filters?.centroCusto) {
      conditions.push(like(viagensExecutadas.centroCusto, `%${filters.centroCusto}%`));
    }
    if (filters?.dataInicio) {
      conditions.push(gte(viagensExecutadas.dataVoo, new Date(filters.dataInicio)));
    }
    if (filters?.dataFim) {
      conditions.push(lte(viagensExecutadas.dataVoo, new Date(filters.dataFim)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async getViagemExecutadaById(id: number): Promise<ViagemExecutada | undefined> {
    const result = await db.select().from(viagensExecutadas).where(eq(viagensExecutadas.id, id));
    return result[0];
  }

  async createViagemExecutada(data: InsertViagemExecutada): Promise<ViagemExecutada> {
    const result = await db.insert(viagensExecutadas).values(data).returning();
    return result[0];
  }

  async updateViagemExecutada(id: number, data: Partial<ViagemExecutada>): Promise<ViagemExecutada | undefined> {
    const result = await db
      .update(viagensExecutadas)
      .set(data)
      .where(eq(viagensExecutadas.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // HOSPEDAGENS EXECUTADAS
  // ============================================================================

  async getHospedagensExecutadas(filters?: {
    colaboradorId?: number;
    centroCusto?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<HospedagemExecutada[]> {
    let query = db.select().from(hospedagensExecutadas).orderBy(desc(hospedagensExecutadas.emissao));
    
    const conditions = [];
    if (filters?.colaboradorId) {
      conditions.push(eq(hospedagensExecutadas.colaboradorId, filters.colaboradorId));
    }
    if (filters?.centroCusto) {
      conditions.push(like(hospedagensExecutadas.centroCusto, `%${filters.centroCusto}%`));
    }
    if (filters?.dataInicio) {
      conditions.push(gte(hospedagensExecutadas.dataHospedagem, new Date(filters.dataInicio)));
    }
    if (filters?.dataFim) {
      conditions.push(lte(hospedagensExecutadas.dataHospedagem, new Date(filters.dataFim)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async getHospedagemExecutadaById(id: number): Promise<HospedagemExecutada | undefined> {
    const result = await db.select().from(hospedagensExecutadas).where(eq(hospedagensExecutadas.id, id));
    return result[0];
  }

  async createHospedagemExecutada(data: InsertHospedagemExecutada): Promise<HospedagemExecutada> {
    const result = await db.insert(hospedagensExecutadas).values(data).returning();
    return result[0];
  }

  async updateHospedagemExecutada(id: number, data: Partial<HospedagemExecutada>): Promise<HospedagemExecutada | undefined> {
    const result = await db
      .update(hospedagensExecutadas)
      .set(data)
      .where(eq(hospedagensExecutadas.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================

  async getDashboardStats(colaboradorId?: number): Promise<{
    adiantamentos: { total: number; valorTotal: number };
    reembolsos: { total: number; valorTotal: number };
    viagens: { total: number };
    passagens: { total: number };
  }> {
    // Get adiantamentos stats
    let adiantamentosQuery = db.select().from(adiantamentos);
    if (colaboradorId) {
      adiantamentosQuery = adiantamentosQuery.where(eq(adiantamentos.colaboradorId, colaboradorId)) as any;
    }
    const allAdiantamentos = await adiantamentosQuery;
    const adiantamentosTotal = allAdiantamentos.length;
    const adiantamentosValorTotal = allAdiantamentos.reduce(
      (sum, a) => sum + parseFloat(a.valorSolicitado || "0"),
      0
    );

    // Get reembolsos stats
    let reembolsosQuery = db.select().from(reembolsos);
    if (colaboradorId) {
      reembolsosQuery = reembolsosQuery.where(eq(reembolsos.colaboradorId, colaboradorId)) as any;
    }
    const allReembolsos = await reembolsosQuery;
    const reembolsosTotal = allReembolsos.length;
    const reembolsosValorTotal = allReembolsos.reduce(
      (sum, r) => sum + parseFloat(r.valorTotalSolicitado || "0"),
      0
    );

    // Get viagens stats
    let viagensQuery = db.select().from(viagensExecutadas);
    if (colaboradorId) {
      viagensQuery = viagensQuery.where(eq(viagensExecutadas.colaboradorId, colaboradorId)) as any;
    }
    const allViagens = await viagensQuery;
    const viagensTotal = allViagens.length;

    // Get passagens stats
    let passagensQuery = db.select().from(passagensAereas);
    if (colaboradorId) {
      passagensQuery = passagensQuery.where(eq(passagensAereas.colaboradorId, colaboradorId)) as any;
    }
    const allPassagens = await passagensQuery;
    const passagensTotal = allPassagens.length;

    return {
      adiantamentos: {
        total: adiantamentosTotal,
        valorTotal: adiantamentosValorTotal,
      },
      reembolsos: {
        total: reembolsosTotal,
        valorTotal: reembolsosValorTotal,
      },
      viagens: {
        total: viagensTotal,
      },
      passagens: {
        total: passagensTotal,
      },
    };
  }
}

export const storage = new DatabaseStorage();
