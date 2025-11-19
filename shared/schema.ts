import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ====================================================================
// AUTH TABLES (Required for Replit Auth - DO NOT MODIFY)
// ====================================================================

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ====================================================================
// CENTROS DE CUSTO (Cost Centers)
// ====================================================================

export const centrosCusto = pgTable("centros_custo", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: varchar("nome", { length: 255 }).notNull().unique(),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCentroCustoSchema = createInsertSchema(centrosCusto).omit({
  id: true,
  ativo: true,
  createdAt: true,
});

export type InsertCentroCusto = z.infer<typeof insertCentroCustoSchema>;
export type CentroCusto = typeof centrosCusto.$inferSelect;

// ====================================================================
// DIRETORIAS (Directorates)
// ====================================================================

export const diretorias = pgTable("diretorias", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: varchar("nome", { length: 255 }).notNull().unique(),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDiretoriaSchema = createInsertSchema(diretorias).omit({
  id: true,
  ativo: true,
  createdAt: true,
});

export type InsertDiretoria = z.infer<typeof insertDiretoriaSchema>;
export type Diretoria = typeof diretorias.$inferSelect;

// ====================================================================
// COLABORADORES (Employees/Staff)
// ====================================================================

export const colaboradores = pgTable("colaboradores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  departamento: varchar("departamento", { length: 255 }),
  diretoria: varchar("diretoria", { length: 255 }),
  centroCusto: varchar("centro_custo", { length: 255 }),
  cargo: varchar("cargo", { length: 255 }),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertColaboradorSchema = createInsertSchema(colaboradores).omit({
  id: true,
  ativo: true,
  createdAt: true,
});

export type InsertColaborador = z.infer<typeof insertColaboradorSchema>;
export type Colaborador = typeof colaboradores.$inferSelect;

// ====================================================================
// ADIANTAMENTOS (Advances)
// ====================================================================

export const adiantamentos = pgTable("adiantamentos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  colaboradorId: integer("colaborador_id").notNull().references(() => colaboradores.id, { onDelete: 'cascade' }),
  dataSolicitacao: timestamp("data_solicitacao").defaultNow(),
  localViagem: varchar("local_viagem", { length: 255 }).notNull(),
  motivo: text("motivo").notNull(),
  dataIda: timestamp("data_ida").notNull(),
  dataVolta: timestamp("data_volta").notNull(),
  valorSolicitado: decimal("valor_solicitado", { precision: 10, scale: 2 }).notNull(),
  diretoriaResponsavel: varchar("diretoria_responsavel", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default('Solicitado'),
  aprovacaoDiretoria: boolean("aprovacao_diretoria"),
  aprovacaoFinanceiro: boolean("aprovacao_financeiro"),
  dataPagamento: timestamp("data_pagamento"),
  formaPagamento: varchar("forma_pagamento", { length: 100 }),
  observacoes: text("observacoes"),
  anexos: jsonb("anexos").$type<string[]>().default([]),
  deletedAt: timestamp("deleted_at"),
  lastUpdatedBy: varchar("last_updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdiantamentoSchema = createInsertSchema(adiantamentos).omit({
  id: true,
  dataSolicitacao: true,
  aprovacaoDiretoria: true,
  aprovacaoFinanceiro: true,
  dataPagamento: true,
  deletedAt: true,
  lastUpdatedBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataIda: z.string(),
  dataVolta: z.string(),
  valorSolicitado: z.number().positive(),
});

export type InsertAdiantamento = z.infer<typeof insertAdiantamentoSchema>;
export type Adiantamento = typeof adiantamentos.$inferSelect;

// ====================================================================
// PRESTAÇÃO DE ADIANTAMENTO (Advance Settlement)
// ====================================================================

export const prestacaoAdiantamento = pgTable("prestacao_adiantamento", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  adiantamentoId: integer("adiantamento_id").notNull().unique().references(() => adiantamentos.id, { onDelete: 'cascade' }),
  dataEnvio: timestamp("data_envio").defaultNow(),
  valorTotalGasto: decimal("valor_total_gasto", { precision: 10, scale: 2 }).notNull(),
  valorDevolvido: decimal("valor_devolvido", { precision: 10, scale: 2 }),
  valorAFaturar: decimal("valor_a_faturar", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).notNull().default('Pendente'),
  observacoes: text("observacoes"),
  anexos: jsonb("anexos").$type<string[]>().default([]),
  deletedAt: timestamp("deleted_at"),
  lastUpdatedBy: varchar("last_updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPrestacaoAdiantamentoSchema = createInsertSchema(prestacaoAdiantamento).omit({
  id: true,
  dataEnvio: true,
  deletedAt: true,
  lastUpdatedBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  valorTotalGasto: z.number().positive(),
  valorDevolvido: z.number().optional(),
  valorAFaturar: z.number().optional(),
});

export type InsertPrestacaoAdiantamento = z.infer<typeof insertPrestacaoAdiantamentoSchema>;
export type PrestacaoAdiantamento = typeof prestacaoAdiantamento.$inferSelect;

// ====================================================================
// ITENS DE DESPESA DA PRESTAÇÃO DE ADIANTAMENTO
// ====================================================================

export const prestacaoAdiantamentoItens = pgTable("prestacao_adiantamento_itens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  prestacaoAdiantamentoId: integer("prestacao_adiantamento_id").notNull().references(() => prestacaoAdiantamento.id, { onDelete: 'cascade' }),
  categoria: varchar("categoria", { length: 100 }).notNull(),
  descricao: text("descricao"),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  comprovante: varchar("comprovante", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPrestacaoAdiantamentoItemSchema = createInsertSchema(prestacaoAdiantamentoItens).omit({
  id: true,
  createdAt: true,
}).extend({
  valor: z.number().positive(),
});

export type InsertPrestacaoAdiantamentoItem = z.infer<typeof insertPrestacaoAdiantamentoItemSchema>;
export type PrestacaoAdiantamentoItem = typeof prestacaoAdiantamentoItens.$inferSelect;

// Categorias de despesa predefinidas
export const CATEGORIAS_DESPESA = [
  'Alimentação',
  'Business Center',
  'Combustível',
  'Estacionamento',
  'Fotocópias',
  'Hospedagem',
  'Passagem Internacional',
  'Táxi',
  'Telefone',
  'Outros',
] as const;

export type CategoriaDespesa = typeof CATEGORIAS_DESPESA[number];

// ====================================================================
// REEMBOLSOS (Reimbursements)
// ====================================================================
// Colaborador já gastou com recursos próprios e solicita reembolso
// informando os itens, valores e comprovantes no momento da solicitação

export const reembolsos = pgTable("reembolsos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  colaboradorId: integer("colaborador_id").notNull().references(() => colaboradores.id, { onDelete: 'cascade' }),
  dataSolicitacao: timestamp("data_solicitacao").defaultNow(),
  motivo: text("motivo").notNull(),
  valorTotalSolicitado: decimal("valor_total_solicitado", { precision: 10, scale: 2 }).notNull(),
  centroCusto: varchar("centro_custo", { length: 255 }).notNull(),
  justificativa: text("justificativa").notNull(),
  status: varchar("status", { length: 50 }).notNull().default('Solicitado'),
  aprovacaoDiretoria: boolean("aprovacao_diretoria"),
  aprovacaoFinanceiro: boolean("aprovacao_financeiro"),
  dataPagamento: timestamp("data_pagamento"),
  formaPagamento: varchar("forma_pagamento", { length: 100 }),
  observacoes: text("observacoes"),
  deletedAt: timestamp("deleted_at"),
  lastUpdatedBy: varchar("last_updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReembolsoSchema = createInsertSchema(reembolsos).omit({
  id: true,
  dataSolicitacao: true,
  aprovacaoDiretoria: true,
  aprovacaoFinanceiro: true,
  dataPagamento: true,
  deletedAt: true,
  lastUpdatedBy: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReembolso = z.infer<typeof insertReembolsoSchema>;
export type Reembolso = typeof reembolsos.$inferSelect;

// ====================================================================
// ITENS DE DESPESA DO REEMBOLSO
// ====================================================================
// Cada item representa uma despesa já realizada pelo colaborador

export const reembolsoItens = pgTable("reembolso_itens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reembolsoId: integer("reembolso_id").notNull().references(() => reembolsos.id, { onDelete: 'cascade' }),
  categoria: varchar("categoria", { length: 100 }).notNull(),
  descricao: text("descricao").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataDespesa: timestamp("data_despesa").notNull(),
  comprovante: varchar("comprovante", { length: 500 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReembolsoItemSchema = createInsertSchema(reembolsoItens).omit({
  id: true,
  createdAt: true,
}).extend({
  valor: z.number().positive(),
  dataDespesa: z.string(), // Será convertido para timestamp
});

export type InsertReembolsoItem = z.infer<typeof insertReembolsoItemSchema>;
export type ReembolsoItem = typeof reembolsoItens.$inferSelect;

// ====================================================================
// PASSAGENS AÉREAS (Flight Tickets)
// ====================================================================

export const passagensAereas = pgTable("passagens_aereas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  colaboradorId: integer("colaborador_id").notNull().references(() => colaboradores.id, { onDelete: 'cascade' }),
  dataSolicitacao: timestamp("data_solicitacao").defaultNow(),
  origem: varchar("origem", { length: 255 }).notNull(),
  destino: varchar("destino", { length: 255 }).notNull(),
  dataIda: timestamp("data_ida").notNull(),
  dataVolta: timestamp("data_volta"),
  objetivo: text("objetivo").notNull(),
  diretoria: varchar("diretoria", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default('Solicitado'),
  aprovacaoDiretoria: boolean("aprovacao_diretoria"),
  aprovacaoFinanceiro: boolean("aprovacao_financeiro"),
  observacoes: text("observacoes"),
  anexos: jsonb("anexos").$type<string[]>().default([]),
  hospedagemId: integer("hospedagem_id"), // Relacionamento opcional com hospedagem
  deletedAt: timestamp("deleted_at"),
  lastUpdatedBy: varchar("last_updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPassagemAereaSchema = createInsertSchema(passagensAereas).omit({
  id: true,
  dataSolicitacao: true,
  aprovacaoDiretoria: true,
  aprovacaoFinanceiro: true,
  deletedAt: true,
  lastUpdatedBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataIda: z.string(),
  dataVolta: z.string().optional(),
});

export type InsertPassagemAerea = z.infer<typeof insertPassagemAereaSchema>;
export type PassagemAerea = typeof passagensAereas.$inferSelect;

// ====================================================================
// HOSPEDAGENS (Accommodations)
// ====================================================================

export const hospedagens = pgTable("hospedagens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  colaboradorId: integer("colaborador_id").notNull().references(() => colaboradores.id, { onDelete: 'cascade' }),
  dataSolicitacao: timestamp("data_solicitacao").defaultNow(),
  cidade: varchar("cidade", { length: 255 }).notNull(),
  estado: varchar("estado", { length: 100 }),
  dataCheckin: timestamp("data_checkin").notNull(),
  dataCheckout: timestamp("data_checkout").notNull(),
  objetivo: text("objetivo").notNull(),
  diretoria: varchar("diretoria", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default('Solicitado'),
  observacoes: text("observacoes"),
  anexos: jsonb("anexos").$type<string[]>().default([]),
  passagemAereaId: integer("passagem_aerea_id"), // Relacionamento opcional com passagem aérea
  deletedAt: timestamp("deleted_at"),
  lastUpdatedBy: varchar("last_updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertHospedagemSchema = createInsertSchema(hospedagens).omit({
  id: true,
  dataSolicitacao: true,
  deletedAt: true,
  lastUpdatedBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataCheckin: z.string(),
  dataCheckout: z.string(),
});

export type InsertHospedagem = z.infer<typeof insertHospedagemSchema>;
export type Hospedagem = typeof hospedagens.$inferSelect;

// ====================================================================
// VIAGENS EXECUTADAS (Executed Trips)
// ====================================================================

export const viagensExecutadas = pgTable("viagens_executadas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  colaboradorId: integer("colaborador_id").notNull().references(() => colaboradores.id, { onDelete: 'cascade' }),
  emissao: timestamp("emissao").defaultNow(),
  dataVoo: timestamp("data_voo").notNull(),
  centroCusto: varchar("centro_custo", { length: 255 }),
  objetivo: text("objetivo").notNull(),
  trecho: varchar("trecho", { length: 255 }).notNull(),
  ciaAerea: varchar("cia_aerea", { length: 255 }),
  valorPassagem: decimal("valor_passagem", { precision: 10, scale: 2 }).notNull(),
  taxaEmbarque: decimal("taxa_embarque", { precision: 10, scale: 2 }).default('0'),
  taxaAgencia: decimal("taxa_agencia", { precision: 10, scale: 2 }).default('0'),
  outrasTaxas: decimal("outras_taxas", { precision: 10, scale: 2 }).default('0'),
  creditoBilheteAnterior: decimal("credito_bilhete_anterior", { precision: 10, scale: 2 }).default('0'),
  valorTotalDesembolsar: decimal("valor_total_desembolsar", { precision: 10, scale: 2 }).notNull(),
  formaPagamento: varchar("forma_pagamento", { length: 100 }),
  responsavelEmissao: varchar("responsavel_emissao", { length: 255 }),
  observacoes: text("observacoes"),
  dataPagamento: timestamp("data_pagamento"),
  fatura: varchar("fatura", { length: 500 }),
  deletedAt: timestamp("deleted_at"),
  lastUpdatedBy: varchar("last_updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertViagemExecutadaSchema = createInsertSchema(viagensExecutadas).omit({
  id: true,
  emissao: true,
  deletedAt: true,
  lastUpdatedBy: true,
  createdAt: true,
  dataPagamento: true,
}).extend({
  dataVoo: z.string(),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  trecho: z.string().min(1, "Trecho é obrigatório"),
  valorPassagem: z.number().positive(),
  taxaEmbarque: z.number().optional(),
  taxaAgencia: z.number().optional(),
  outrasTaxas: z.number().optional(),
  creditoBilheteAnterior: z.number().optional(),
  valorTotalDesembolsar: z.number().positive(),
});

export type InsertViagemExecutada = z.infer<typeof insertViagemExecutadaSchema>;
export type ViagemExecutada = typeof viagensExecutadas.$inferSelect;

// ====================================================================
// HOSPEDAGENS EXECUTADAS (Executed Accommodations)
// ====================================================================

export const hospedagensExecutadas = pgTable("hospedagens_executadas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  colaboradorId: integer("colaborador_id").notNull().references(() => colaboradores.id, { onDelete: 'cascade' }),
  emissao: timestamp("emissao").defaultNow(),
  dataHospedagem: timestamp("data_hospedagem").notNull(),
  centroCusto: varchar("centro_custo", { length: 255 }),
  objetivo: text("objetivo").notNull(),
  hotel: varchar("hotel", { length: 255 }).notNull(),
  valorDiaria: decimal("valor_diaria", { precision: 10, scale: 2 }).notNull(),
  cafe: decimal("cafe", { precision: 10, scale: 2 }).default('0'),
  taxa: decimal("taxa", { precision: 10, scale: 2 }).default('0'),
  extrasPosteriores: decimal("extras_posteriores", { precision: 10, scale: 2 }).default('0'),
  valorTotal: decimal("valor_total", { precision: 10, scale: 2 }).notNull(),
  responsavelEmissao: varchar("responsavel_emissao", { length: 255 }),
  formaPagamento: varchar("forma_pagamento", { length: 100 }),
  observacoes: text("observacoes"),
  dataPagamento: timestamp("data_pagamento"),
  fatura: varchar("fatura", { length: 500 }),
  deletedAt: timestamp("deleted_at"),
  lastUpdatedBy: varchar("last_updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHospedagemExecutadaSchema = createInsertSchema(hospedagensExecutadas).omit({
  id: true,
  emissao: true,
  deletedAt: true,
  lastUpdatedBy: true,
  createdAt: true,
  dataPagamento: true,
}).extend({
  dataHospedagem: z.string(),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  hotel: z.string().min(1, "Hotel é obrigatório"),
  valorDiaria: z.number().positive(),
  cafe: z.number().optional(),
  taxa: z.number().optional(),
  extrasPosteriores: z.number().optional(),
  valorTotal: z.number().positive(),
});

export type InsertHospedagemExecutada = z.infer<typeof insertHospedagemExecutadaSchema>;
export type HospedagemExecutada = typeof hospedagensExecutadas.$inferSelect;

// ====================================================================
// RELATIONS
// ====================================================================

export const colaboradoresRelations = relations(colaboradores, ({ one, many }) => ({
  user: one(users, {
    fields: [colaboradores.userId],
    references: [users.id],
  }),
  adiantamentos: many(adiantamentos),
  reembolsos: many(reembolsos),
  passagensAereas: many(passagensAereas),
  hospedagens: many(hospedagens),
  viagensExecutadas: many(viagensExecutadas),
  hospedagensExecutadas: many(hospedagensExecutadas),
}));

export const adiantamentosRelations = relations(adiantamentos, ({ one }) => ({
  colaborador: one(colaboradores, {
    fields: [adiantamentos.colaboradorId],
    references: [colaboradores.id],
  }),
  prestacao: one(prestacaoAdiantamento, {
    fields: [adiantamentos.id],
    references: [prestacaoAdiantamento.adiantamentoId],
  }),
}));

export const prestacaoAdiantamentoRelations = relations(prestacaoAdiantamento, ({ one }) => ({
  adiantamento: one(adiantamentos, {
    fields: [prestacaoAdiantamento.adiantamentoId],
    references: [adiantamentos.id],
  }),
}));

export const reembolsosRelations = relations(reembolsos, ({ one, many }) => ({
  colaborador: one(colaboradores, {
    fields: [reembolsos.colaboradorId],
    references: [colaboradores.id],
  }),
  itens: many(reembolsoItens),
}));

export const reembolsoItensRelations = relations(reembolsoItens, ({ one }) => ({
  reembolso: one(reembolsos, {
    fields: [reembolsoItens.reembolsoId],
    references: [reembolsos.id],
  }),
}));

export const passagensAereasRelations = relations(passagensAereas, ({ one }) => ({
  colaborador: one(colaboradores, {
    fields: [passagensAereas.colaboradorId],
    references: [colaboradores.id],
  }),
  hospedagem: one(hospedagens, {
    fields: [passagensAereas.hospedagemId],
    references: [hospedagens.id],
  }),
}));

export const hospedagensRelations = relations(hospedagens, ({ one }) => ({
  colaborador: one(colaboradores, {
    fields: [hospedagens.colaboradorId],
    references: [colaboradores.id],
  }),
  passagemAerea: one(passagensAereas, {
    fields: [hospedagens.passagemAereaId],
    references: [passagensAereas.id],
  }),
}));

export const viagensExecutadasRelations = relations(viagensExecutadas, ({ one }) => ({
  colaborador: one(colaboradores, {
    fields: [viagensExecutadas.colaboradorId],
    references: [colaboradores.id],
  }),
}));

export const hospedagensExecutadasRelations = relations(hospedagensExecutadas, ({ one }) => ({
  colaborador: one(colaboradores, {
    fields: [hospedagensExecutadas.colaboradorId],
    references: [colaboradores.id],
  }),
}));

// ====================================================================
// ROLES (for Permission Control)
// ====================================================================

export const colaboradorRoles = pgTable("colaborador_roles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  colaboradorId: integer("colaborador_id").notNull().references(() => colaboradores.id, { onDelete: 'cascade' }),
  role: varchar("role", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertColaboradorRoleSchema = createInsertSchema(colaboradorRoles).omit({
  id: true,
  createdAt: true,
});

export type InsertColaboradorRole = z.infer<typeof insertColaboradorRoleSchema>;
export type ColaboradorRole = typeof colaboradorRoles.$inferSelect;

// ====================================================================
// ATTACHMENTS (for File Upload Management)
// ====================================================================

export const attachments = pgTable("attachments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: integer("entity_id").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  filepath: varchar("filepath", { length: 500 }).notNull(),
  filesize: integer("filesize"),
  mimetype: varchar("mimetype", { length: 100 }),
  uploadedBy: integer("uploaded_by").references(() => colaboradores.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
});

export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;
