import nodemailer from 'nodemailer';
import type { Adiantamento, Reembolso, PassagemAerea, Hospedagem } from '@shared/schema';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const APP_URL = process.env.REPLIT_DEPLOYMENT 
  ? `https://${process.env.REPL_SLUG}.${process.env.REPLIT_DEPLOYMENT}` 
  : 'http://localhost:5000';

interface EmailTemplate {
  subject: string;
  html: string;
}

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num || 0);
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

function getEmailTemplate(
  title: string,
  content: string,
  actionButton?: { text: string; url: string }
): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #F5F8FC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F8FC; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,70,80,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #004650 0%, #006978 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #FFC828; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ABERT
              </h1>
              <p style="margin: 8px 0 0 0; color: #FFFFFF; font-size: 14px; opacity: 0.9;">
                Sistema de Gestão de Despesas
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          ${actionButton ? `
          <!-- Action Button -->
          <tr>
            <td style="padding: 0 40px 40px 40px;" align="center">
              <a href="${actionButton.url}" 
                 style="display: inline-block; background-color: #FFC828; color: #004650; 
                        text-decoration: none; padding: 14px 32px; border-radius: 10px; 
                        font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(255,200,40,0.3);">
                ${actionButton.text}
              </a>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F8FC; padding: 24px 40px; border-top: 1px solid #E8EDF2;">
              <p style="margin: 0; color: #4A5458; font-size: 12px; text-align: center; line-height: 1.6;">
                Este é um email automático do Sistema de Gestão de Despesas da ABERT.<br>
                Para dúvidas, entre em contato com o departamento financeiro.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ==================== ADIANTAMENTOS ====================

export async function sendAdiantamentoCreatedEmail(
  adiantamento: Adiantamento,
  solicitanteEmail: string,
  diretoriaEmails: string[]
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 24px 0; color: #004650; font-size: 24px; font-weight: 700;">
      Nova Solicitação de Adiantamento
    </h2>
    
    <div style="background-color: #F5F8FC; border-left: 4px solid #004650; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px 0; color: #4A5458; font-size: 14px; font-weight: 600;">
        DETALHES DA SOLICITAÇÃO
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px; width: 40%;">
            <strong>Solicitante:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${solicitanteEmail.split('@')[0]}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Local da Viagem:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${adiantamento.localViagem}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Período:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${formatDate(adiantamento.dataIda)} até ${formatDate(adiantamento.dataVolta)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Valor Solicitado:</strong>
          </td>
          <td style="padding: 8px 0; color: #004650; font-size: 18px; font-weight: 700;">
            ${formatCurrency(adiantamento.valorSolicitado)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Motivo:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${adiantamento.motivo}
          </td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 24px 0 16px 0; color: #4A5458; font-size: 14px; line-height: 1.6;">
      Esta solicitação aguarda sua análise e aprovação. Clique no botão abaixo para revisar os detalhes completos e tomar uma decisão.
    </p>
  `;

  const template = getEmailTemplate(
    'Nova Solicitação de Adiantamento - ABERT',
    content,
    {
      text: 'Analisar Solicitação',
      url: `${APP_URL}/adiantamentos`,
    }
  );

  await transporter.sendMail({
    from: `"Sistema ABERT" <${process.env.SMTP_USER}>`,
    to: diretoriaEmails.join(', '),
    subject: `🔔 Nova Solicitação de Adiantamento - ${adiantamento.localViagem}`,
    html: template,
  });

  console.log(`✓ Email enviado: Adiantamento #${adiantamento.id} criado`);
}

export async function sendAdiantamentoApprovedByDiretoriaEmail(
  adiantamento: Adiantamento,
  solicitanteEmail: string,
  financeiroEmails: string[]
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 24px 0; color: #004650; font-size: 24px; font-weight: 700;">
      Adiantamento Aprovado pela Diretoria
    </h2>
    
    <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; color: #2E7D32; font-size: 14px; font-weight: 600;">
        ✓ APROVADO PELA DIRETORIA
      </p>
      <p style="margin: 0; color: #4A5458; font-size: 13px;">
        Aguardando aprovação do setor financeiro
      </p>
    </div>
    
    <div style="background-color: #F5F8FC; border-left: 4px solid #004650; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px; width: 40%;">
            <strong>Solicitante:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${solicitanteEmail.split('@')[0]}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Local da Viagem:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${adiantamento.localViagem}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Valor:</strong>
          </td>
          <td style="padding: 8px 0; color: #004650; font-size: 18px; font-weight: 700;">
            ${formatCurrency(adiantamento.valorSolicitado)}
          </td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 24px 0 16px 0; color: #4A5458; font-size: 14px; line-height: 1.6;">
      Por favor, analise esta solicitação e proceda com a aprovação financeira.
    </p>
  `;

  await Promise.all([
    // Email para financeiro
    transporter.sendMail({
      from: `"Sistema ABERT" <${process.env.SMTP_USER}>`,
      to: financeiroEmails.join(', '),
      subject: `💰 Aprovação Financeira Necessária - ${adiantamento.localViagem}`,
      html: getEmailTemplate(
        'Aprovação Financeira Necessária - ABERT',
        content,
        {
          text: 'Analisar no Sistema',
          url: `${APP_URL}/adiantamentos`,
        }
      ),
    }),
    // Email de notificação para solicitante
    transporter.sendMail({
      from: `"Sistema ABERT" <${process.env.SMTP_USER}>`,
      to: solicitanteEmail,
      subject: `✓ Seu Adiantamento foi Aprovado pela Diretoria`,
      html: getEmailTemplate(
        'Adiantamento Aprovado pela Diretoria',
        `
          <h2 style="margin: 0 0 24px 0; color: #004650; font-size: 24px; font-weight: 700;">
            Boa Notícia!
          </h2>
          <p style="margin: 0 0 16px 0; color: #4A5458; font-size: 14px; line-height: 1.6;">
            Seu adiantamento para <strong>${adiantamento.localViagem}</strong> no valor de 
            <strong style="color: #004650;">${formatCurrency(adiantamento.valorSolicitado)}</strong> 
            foi aprovado pela diretoria.
          </p>
          <p style="margin: 0 0 16px 0; color: #4A5458; font-size: 14px; line-height: 1.6;">
            Agora aguardamos a aprovação do setor financeiro para liberação do valor.
          </p>
        `,
        {
          text: 'Ver Status',
          url: `${APP_URL}/adiantamentos`,
        }
      ),
    }),
  ]);

  console.log(`✓ Emails enviados: Adiantamento #${adiantamento.id} aprovado pela diretoria`);
}

export async function sendAdiantamentoApprovedByFinanceiroEmail(
  adiantamento: Adiantamento,
  solicitanteEmail: string
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 24px 0; color: #4CAF50; font-size: 24px; font-weight: 700;">
      🎉 Adiantamento Totalmente Aprovado!
    </h2>
    
    <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; color: #2E7D32; font-size: 14px; font-weight: 600;">
        ✓ APROVAÇÃO COMPLETA
      </p>
      <p style="margin: 0; color: #4A5458; font-size: 13px;">
        Seu adiantamento foi aprovado pela diretoria e pelo financeiro
      </p>
    </div>
    
    <div style="background-color: #F5F8FC; border-left: 4px solid #004650; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px; width: 40%;">
            <strong>Local da Viagem:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${adiantamento.localViagem}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Período:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${formatDate(adiantamento.dataIda)} até ${formatDate(adiantamento.dataVolta)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Valor Aprovado:</strong>
          </td>
          <td style="padding: 8px 0; color: #4CAF50; font-size: 20px; font-weight: 700;">
            ${formatCurrency(adiantamento.valorSolicitado)}
          </td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 24px 0 16px 0; color: #4A5458; font-size: 14px; line-height: 1.6;">
      O valor será processado e disponibilizado em breve. Você receberá uma notificação quando o pagamento for efetuado.
    </p>
  `;

  await transporter.sendMail({
    from: `"Sistema ABERT" <${process.env.SMTP_USER}>`,
    to: solicitanteEmail,
    subject: `✓ Adiantamento Aprovado - Pagamento em Processamento`,
    html: getEmailTemplate(
      'Adiantamento Aprovado',
      content,
      {
        text: 'Ver Detalhes',
        url: `${APP_URL}/adiantamentos`,
      }
    ),
  });

  console.log(`✓ Email enviado: Adiantamento #${adiantamento.id} aprovado pelo financeiro`);
}

export async function sendAdiantamentoRejectedEmail(
  adiantamento: Adiantamento,
  solicitanteEmail: string,
  rejectedBy: 'Diretoria' | 'Financeiro',
  reason?: string
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 24px 0; color: #D32F2F; font-size: 24px; font-weight: 700;">
      Adiantamento Não Aprovado
    </h2>
    
    <div style="background-color: #FFEBEE; border-left: 4px solid #D32F2F; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; color: #C62828; font-size: 14px; font-weight: 600;">
        ✗ REJEITADO POR: ${rejectedBy.toUpperCase()}
      </p>
      <p style="margin: 0; color: #4A5458; font-size: 13px;">
        Sua solicitação foi analisada e não foi aprovada
      </p>
    </div>
    
    <div style="background-color: #F5F8FC; border-left: 4px solid #004650; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px; width: 40%;">
            <strong>Local da Viagem:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${adiantamento.localViagem}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Valor:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${formatCurrency(adiantamento.valorSolicitado)}
          </td>
        </tr>
        ${reason ? `
        <tr>
          <td colspan="2" style="padding: 16px 0 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Motivo da Rejeição:</strong>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${reason}
          </td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <p style="margin: 24px 0 16px 0; color: #4A5458; font-size: 14px; line-height: 1.6;">
      Você pode entrar em contato com ${rejectedBy === 'Diretoria' ? 'a diretoria' : 'o financeiro'} para mais esclarecimentos ou criar uma nova solicitação com as devidas correções.
    </p>
  `;

  await transporter.sendMail({
    from: `"Sistema ABERT" <${process.env.SMTP_USER}>`,
    to: solicitanteEmail,
    subject: `✗ Adiantamento Não Aprovado - ${adiantamento.localViagem}`,
    html: getEmailTemplate(
      'Adiantamento Não Aprovado',
      content,
      {
        text: 'Ver Detalhes',
        url: `${APP_URL}/adiantamentos`,
      }
    ),
  });

  console.log(`✓ Email enviado: Adiantamento #${adiantamento.id} rejeitado por ${rejectedBy}`);
}

// ==================== REEMBOLSOS ====================

export async function sendReembolsoCreatedEmail(
  reembolso: Reembolso,
  solicitanteEmail: string,
  diretoriaEmails: string[]
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 24px 0; color: #004650; font-size: 24px; font-weight: 700;">
      Nova Solicitação de Reembolso
    </h2>
    
    <div style="background-color: #F5F8FC; border-left: 4px solid #004650; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px; width: 40%;">
            <strong>Solicitante:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${solicitanteEmail.split('@')[0]}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Motivo:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${reembolso.motivo}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Valor Total:</strong>
          </td>
          <td style="padding: 8px 0; color: #004650; font-size: 18px; font-weight: 700;">
            ${formatCurrency(reembolso.valorTotalSolicitado)}
          </td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 24px 0 16px 0; color: #4A5458; font-size: 14px; line-height: 1.6;">
      Esta solicitação de reembolso aguarda sua análise e aprovação.
    </p>
  `;

  await transporter.sendMail({
    from: `"Sistema ABERT" <${process.env.SMTP_USER}>`,
    to: diretoriaEmails.join(', '),
    subject: `🔔 Nova Solicitação de Reembolso - ${formatCurrency(reembolso.valorTotalSolicitado)}`,
    html: getEmailTemplate(
      'Nova Solicitação de Reembolso',
      content,
      {
        text: 'Analisar Solicitação',
        url: `${APP_URL}/reembolsos`,
      }
    ),
  });

  console.log(`✓ Email enviado: Reembolso #${reembolso.id} criado`);
}

export async function sendReembolsoApprovedEmail(
  reembolso: Reembolso,
  solicitanteEmail: string
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 24px 0; color: #4CAF50; font-size: 24px; font-weight: 700;">
      🎉 Reembolso Aprovado!
    </h2>
    
    <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; color: #2E7D32; font-size: 14px; font-weight: 600;">
        ✓ REEMBOLSO APROVADO
      </p>
      <p style="margin: 0; color: #4A5458; font-size: 13px;">
        Seu reembolso foi aprovado e será processado
      </p>
    </div>
    
    <div style="background-color: #F5F8FC; border-left: 4px solid #004650; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px; width: 40%;">
            <strong>Motivo:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${reembolso.motivo}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Valor Aprovado:</strong>
          </td>
          <td style="padding: 8px 0; color: #4CAF50; font-size: 20px; font-weight: 700;">
            ${formatCurrency(reembolso.valorTotalSolicitado)}
          </td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 24px 0 16px 0; color: #4A5458; font-size: 14px; line-height: 1.6;">
      O valor será creditado em sua conta em breve.
    </p>
  `;

  await transporter.sendMail({
    from: `"Sistema ABERT" <${process.env.SMTP_USER}>`,
    to: solicitanteEmail,
    subject: `✓ Reembolso Aprovado - ${formatCurrency(reembolso.valorTotalSolicitado)}`,
    html: getEmailTemplate(
      'Reembolso Aprovado',
      content,
      {
        text: 'Ver Detalhes',
        url: `${APP_URL}/reembolsos`,
      }
    ),
  });

  console.log(`✓ Email enviado: Reembolso #${reembolso.id} aprovado`);
}

export async function sendReembolsoRejectedEmail(
  reembolso: Reembolso,
  solicitanteEmail: string,
  reason?: string
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 24px 0; color: #D32F2F; font-size: 24px; font-weight: 700;">
      Reembolso Não Aprovado
    </h2>
    
    <div style="background-color: #FFEBEE; border-left: 4px solid #D32F2F; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; color: #C62828; font-size: 14px; font-weight: 600;">
        ✗ SOLICITAÇÃO REJEITADA
      </p>
      <p style="margin: 0; color: #4A5458; font-size: 13px;">
        Sua solicitação foi analisada e não foi aprovada
      </p>
    </div>
    
    <div style="background-color: #F5F8FC; border-left: 4px solid #004650; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px; width: 40%;">
            <strong>Motivo:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${reembolso.motivo}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Valor:</strong>
          </td>
          <td style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${formatCurrency(reembolso.valorTotalSolicitado)}
          </td>
        </tr>
        ${reason ? `
        <tr>
          <td colspan="2" style="padding: 16px 0 8px 0; color: #4A5458; font-size: 14px;">
            <strong>Motivo da Rejeição:</strong>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 8px 0; color: #1A1F23; font-size: 14px;">
            ${reason}
          </td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <p style="margin: 24px 0 16px 0; color: #4A5458; font-size: 14px; line-height: 1.6;">
      Entre em contato com a diretoria para mais esclarecimentos.
    </p>
  `;

  await transporter.sendMail({
    from: `"Sistema ABERT" <${process.env.SMTP_USER}>`,
    to: solicitanteEmail,
    subject: `✗ Reembolso Não Aprovado - ${reembolso.descricao}`,
    html: getEmailTemplate(
      'Reembolso Não Aprovado',
      content,
      {
        text: 'Ver Detalhes',
        url: `${APP_URL}/reembolsos`,
      }
    ),
  });

  console.log(`✓ Email enviado: Reembolso #${reembolso.id} rejeitado`);
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✓ Configuração SMTP verificada com sucesso');
    return true;
  } catch (error) {
    console.error('✗ Erro na configuração SMTP:', error);
    return false;
  }
}
