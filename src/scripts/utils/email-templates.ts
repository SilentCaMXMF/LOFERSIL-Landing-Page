/**
 * Email Templates - Professional email template generation and management
 *
 * Comprehensive email template system for LOFERSIL with:
 * - Professional HTML email templates with Portuguese content
 * - Plain text fallback templates
 * - Dynamic content insertion
 * - Mobile-responsive design
 * - Email branding and styling
 * - Template localization support
 * - Multiple template types
 * - Security and XSS prevention
 */

const DOMPurifyInstance = (globalThis as any).DOMPurify ||
  (typeof window !== "undefined" && (window as any).DOMPurify) || {
    sanitize: (input: string, config?: any) => {
      // Basic sanitization fallback
      if (typeof input !== "string") return input;

      let sanitized = input;

      // Remove script tags and their content
      sanitized = sanitized.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        "",
      );

      // Remove all event handlers (both quoted and unquoted)
      sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
      sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^>\s]*/gi, "");

      // Remove javascript: URLs
      sanitized = sanitized.replace(/javascript\s*:/gi, "");

      // Remove dangerous functions
      sanitized = sanitized.replace(/alert\s*\(/gi, "alert-disabled(");
      sanitized = sanitized.replace(/eval\s*\(/gi, "eval-disabled(");
      sanitized = sanitized.replace(/document\./gi, "document-disabled.");

      // Remove iframe, object, embed, form, input, button tags
      sanitized = sanitized.replace(
        /<(iframe|object|embed|form|input|button)[^>]*>/gi,
        "",
      );

      return sanitized;
    },
  };

export interface EmailTemplateData {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  subject?: string;
  timestamp?: Date;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  website?: string;
  referenceId?: string;
  customFields?: Record<string, any>;
  [key: string]: any;
}

export interface EmailTemplateConfig {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  website: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  locale: "pt" | "en";
  footerText?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
  metadata: {
    templateType: string;
    generatedAt: Date;
    size: number;
    hasImages: boolean;
    hasLinks: boolean;
    responsive: boolean;
  };
}

export type TemplateType =
  | "contact-confirmation"
  | "contact-notification"
  | "auto-reply"
  | "error-notification"
  | "newsletter"
  | "promotion";

/**
 * EmailTemplateManager - Main email template generation and management class
 */
export class EmailTemplateManager {
  private config: EmailTemplateConfig;
  private templateCache: Map<string, EmailTemplate> = new Map();

  constructor(config: Partial<EmailTemplateConfig> = {}) {
    this.config = {
      companyName: "LOFERSIL",
      companyAddress: "R. Gomes Freire 187 B, 1150-178 Lisboa",
      companyPhone: "+351 21 123 4567",
      companyEmail: "info@lofersil.com",
      website: "https://lofersil.com",
      primaryColor: "#2c3e50",
      secondaryColor: "#e74c3c",
      fontFamily: "Arial, sans-serif",
      locale: "pt",
      ...config,
    };
  }

  /**
   * Generate email template based on type
   */
  generateTemplate(
    type: TemplateType,
    data: EmailTemplateData = {},
  ): EmailTemplate {
    const cacheKey = `${type}-${JSON.stringify(data)}`;

    // Check cache first
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    let template: EmailTemplate;

    switch (type) {
      case "contact-confirmation":
        template = this.generateContactConfirmationTemplate(data);
        break;
      case "contact-notification":
        template = this.generateContactNotificationTemplate(data);
        break;
      case "auto-reply":
        template = this.generateAutoReplyTemplate(data);
        break;
      case "error-notification":
        template = this.generateErrorNotificationTemplate(data);
        break;
      case "newsletter":
        template = this.generateNewsletterTemplate(data);
        break;
      case "promotion":
        template = this.generatePromotionTemplate(data);
        break;
      default:
        throw new Error(`Unknown template type: ${type}`);
    }

    // Cache the template
    this.templateCache.set(cacheKey, template);

    return template;
  }

  /**
   * Generate contact form confirmation email (sent to customer)
   */
  private generateContactConfirmationTemplate(
    data: EmailTemplateData,
  ): EmailTemplate {
    const subject = this.getLocaleText(
      "contact_confirmation_subject",
      data.name,
    );
    const htmlContent = this.generateContactConfirmationHTML(data);
    const textContent = this.generateContactConfirmationText(data);

    return this.createEmailTemplate(
      "contact-confirmation",
      subject,
      htmlContent,
      textContent,
    );
  }

  /**
   * Generate contact notification email (sent to LOFERSIL team)
   */
  private generateContactNotificationTemplate(
    data: EmailTemplateData,
  ): EmailTemplate {
    const subject = this.getLocaleText(
      "contact_notification_subject",
      data.name,
    );
    const htmlContent = this.generateContactNotificationHTML(data);
    const textContent = this.generateContactNotificationText(data);

    return this.createEmailTemplate(
      "contact-notification",
      subject,
      htmlContent,
      textContent,
    );
  }

  /**
   * Generate auto-reply email (immediate response to customer)
   */
  private generateAutoReplyTemplate(data: EmailTemplateData): EmailTemplate {
    const subject = this.getLocaleText("auto_reply_subject");
    const htmlContent = this.generateAutoReplyHTML(data);
    const textContent = this.generateAutoReplyText(data);

    return this.createEmailTemplate(
      "auto-reply",
      subject,
      htmlContent,
      textContent,
    );
  }

  /**
   * Generate error notification email (internal error alerts)
   */
  private generateErrorNotificationTemplate(
    data: EmailTemplateData,
  ): EmailTemplate {
    const subject = this.getLocaleText("error_notification_subject");
    const htmlContent = this.generateErrorNotificationHTML(data);
    const textContent = this.generateErrorNotificationText(data);

    return this.createEmailTemplate(
      "error-notification",
      subject,
      htmlContent,
      textContent,
    );
  }

  /**
   * Generate newsletter template
   */
  private generateNewsletterTemplate(data: EmailTemplateData): EmailTemplate {
    const subject = this.getLocaleText("newsletter_subject");
    const htmlContent = this.generateNewsletterHTML(data);
    const textContent = this.generateNewsletterText(data);

    return this.createEmailTemplate(
      "newsletter",
      subject,
      htmlContent,
      textContent,
    );
  }

  /**
   * Generate promotion template
   */
  private generatePromotionTemplate(data: EmailTemplateData): EmailTemplate {
    const subject = this.getLocaleText("promotion_subject");
    const htmlContent = this.generatePromotionHTML(data);
    const textContent = this.generatePromotionText(data);

    return this.createEmailTemplate(
      "promotion",
      subject,
      htmlContent,
      textContent,
    );
  }

  /**
   * Create email template object
   */
  private createEmailTemplate(
    templateType: string,
    subject: string,
    htmlContent: string,
    textContent: string,
  ): EmailTemplate {
    const htmlSize = new Blob([htmlContent]).size;
    const textSize = new Blob([textContent]).size;
    const totalSize = htmlSize + textSize;

    return {
      subject,
      htmlContent,
      textContent,
      metadata: {
        templateType,
        generatedAt: new Date(),
        size: totalSize,
        hasImages: htmlContent.includes("<img"),
        hasLinks: htmlContent.includes("<a href="),
        responsive:
          htmlContent.includes("viewport") && htmlContent.includes("max-width"),
      },
    };
  }

  /**
   * Sanitize data to prevent XSS
   */
  private sanitizeData(data: EmailTemplateData): EmailTemplateData {
    const sanitized: EmailTemplateData = {};

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === "string") {
        sanitized[key] =
          DOMPurifyInstance?.sanitize(value, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
          }) || value;
      } else if (value instanceof Date) {
        sanitized[key] = value;
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = value;
      } else if (value !== undefined) {
        sanitized[key] = String(value);
      }
    });

    return sanitized;
  }

  /**
   * Get localized text
   */
  private getLocaleText(key: string, ...args: any[]): string {
    const texts: Record<string, Record<string, string>> = {
      pt: {
        contact_confirmation_subject: `Confirmação de Contacto - ${this.config.companyName}`,
        contact_confirmation_title: "Confirmação de Contacto",
        confirmation_title: "Obrigado pelo seu contacto, {name}!",
        confirmation_message:
          "Recebemos a sua mensagem e entraremos em contacto consigo brevemente.",
        your_message_details: "Detalhes da sua mensagem",
        name_label: "Nome",
        email_label: "Email",
        phone_label: "Telefone",
        date_label: "Data",
        message_label: "Mensagem",
        next_steps:
          "A nossa equipa irá analisar a sua mensagem e responderá dentro de 24 horas úteis.",
        contact_info: "Para contactos urgentes, pode ligar-nos diretamente:",
        all_rights_reserved: "Todos os direitos reservados.",
        website: "Website",

        contact_notification_subject: `Nova Mensagem de Contacto - {name} - ${this.config.companyName}`,
        contact_notification_title: "Notificação de Contacto",
        new_contact_message: "Nova Mensagem de Contacto Recebida",
        contact_details: "Detalhes do Contacto",
        reference_id: "ID de Referência",
        action_required: "AÇÃO NECESSÁRIA",
        respond_prompt:
          "Por favor, responda a esta mensagem o mais rápido possível.",
        respond_now: "Responder Agora",

        auto_reply_subject: `Receção da sua Mensagem - ${this.config.companyName}`,
        auto_reply_title: "Mensagem Recebida",
        message_received: "Mensagem Recebida",
        auto_reply_greeting: "Olá {name},",
        automatic_response: "Esta é uma resposta automática.",
        auto_reply_message:
          "Recebemos a sua mensagem e iremos responder assim que possível.",
        thank_you_message:
          "Agradecemos o seu contacto e aguardamos a oportunidade de o ajudar.",
        business_hours: "Horário de Funcionamento",
        monday_friday: "Segunda a Sexta",
        saturday: "Sábado",
        sunday: "Domingo",
        closed: "Fechado",

        error_notification_subject: `Alerta de Erro do Sistema - ${this.config.companyName}`,
        error_notification_title: "Notificação de Erro",
        system_error: "Erro do Sistema",
        error_occurred: "Ocorreu um erro no sistema.",
        error_id: "ID do Erro",
        timestamp: "Data/Hora",
        error_details: "Detalhes do Erro",
        no_error_details: "Não foram fornecidos detalhes do erro.",
        investigate_error:
          "Por favor, investigue este erro o mais rápido possível.",
        view_error_logs: "Ver Logs de Erro",

        newsletter_subject: `Newsletter ${this.config.companyName}`,
        newsletter_title: "Newsletter LOFERSIL",
        newsletter_greeting: "Olá {name},",
        newsletter_title_main: "Novidades e Ofertas Exclusivas",
        newsletter_intro:
          "Descubra as últimas novidades e ofertas exclusivas na LOFERSIL.",
        featured_products: "Produtos em Destaque",
        featured_products_description:
          "Conheça os nossos produtos mais populares:",
        product_1: "Artigos para Bebés",
        product_2: "Material de Escritório",
        product_3: "Canetas Promocionais",
        newsletter_call_to_action:
          "Visite a nossa loja para conhecer todas as novidades!",
        special_offers: "Ofertas Especiais",
        special_offers_description:
          "Aproveite as nossas ofertas exclusivas desta semana!",
        visit_store: "Visitar Loja",
        unsubscribe: "Cancelar subscrição",

        promotion_subject: `Oferta Exclusiva ${this.config.companyName}`,
        limited_time_offer: "Oferta por Tempo Limitado",
        exclusive_deal: "OFERTA EXCLUSIVA",
        promotion_greeting: "Olá {name},",
        promotion_description:
          "Aproveite 20% de desconto em todos os produtos!",
        offer_expiry: "Oferta Expira em:",
        offer_expiry_details: "Esta oferta expira em 7 dias. Não perca!",
        how_to_use: "Como Usar",
        promo_code_instructions:
          "Use o código promocional abaixo no checkout para obter 20% de desconto:",
        shop_now: "Comprar Agora",
      },
      en: {
        contact_confirmation_subject: "Contact Confirmation - LOFERSIL",
        contact_confirmation_title: "Contact Confirmation",
        confirmation_title: "Thank you for your contact, {name}!",
        confirmation_message:
          "We received your message and will get back to you shortly.",
        your_message_details: "Your Message Details",
        name_label: "Name",
        email_label: "Email",
        phone_label: "Phone",
        date_label: "Date",
        message_label: "Message",
        next_steps:
          "Our team will review your message and respond within 24 business hours.",
        contact_info: "For urgent inquiries, you can call us directly:",
        all_rights_reserved: "All rights reserved.",
        website: "Website",

        contact_notification_subject: "New Contact Message - {name}",
        contact_notification_title: "Contact Notification",
        new_contact_message: "New Contact Message Received",
        contact_details: "Contact Details",
        reference_id: "Reference ID",
        action_required: "ACTION REQUIRED",
        respond_prompt: "Please respond to this message as soon as possible.",
        respond_now: "Respond Now",

        auto_reply_subject: "Message Received - LOFERSIL",
        auto_reply_title: "Message Received",
        message_received: "Message Received",
        auto_reply_greeting: "Hello {name},",
        automatic_response: "This is an automatic response.",
        auto_reply_message:
          "We received your message and will respond as soon as possible.",
        thank_you_message:
          "Thank you for contacting us and we look forward to helping you.",
        business_hours: "Business Hours",
        monday_friday: "Monday to Friday",
        saturday: "Saturday",
        sunday: "Sunday",
        closed: "Closed",

        error_notification_subject: "System Error Alert - LOFERSIL",
        error_notification_title: "Error Notification",
        system_error: "System Error",
        error_occurred: "An error occurred in the system.",
        error_id: "Error ID",
        timestamp: "Timestamp",
        error_details: "Error Details",
        no_error_details: "No error details provided.",
        investigate_error: "Please investigate this error as soon as possible.",
        view_error_logs: "View Error Logs",

        newsletter_subject: "LOFERSIL Newsletter",
        newsletter_title: "LOFERSIL Newsletter",
        newsletter_greeting: "Hello {name},",
        newsletter_title_main: "News and Exclusive Offers",
        newsletter_intro:
          "Discover the latest news and exclusive offers at LOFERSIL.",
        featured_products: "Featured Products",
        featured_products_description: "Meet our most popular products:",
        product_1: "Baby Products",
        product_2: "Office Supplies",
        product_3: "Promotional Pens",
        newsletter_call_to_action: "Visit our store to discover all the news!",
        special_offers: "Special Offers",
        special_offers_description:
          "Take advantage of our exclusive offers this week!",
        visit_store: "Visit Store",
        unsubscribe: "Unsubscribe",

        promotion_subject: `Exclusive ${this.config.companyName} Offer`,
        limited_time_offer: "Limited Time Offer",
        exclusive_deal: "EXCLUSIVE DEAL",
        promotion_greeting: "Hello {name},",
        promotion_description: "Take advantage of 20% off all products!",
        offer_expiry: "Offer Expires in:",
        offer_expiry_details: "This offer expires in 7 days. Don't miss out!",
        how_to_use: "How to Use",
        promo_code_instructions:
          "Use the promo code below at checkout to get 20% off:",
        shop_now: "Shop Now",
      },
    };

    const localeTexts = texts[this.config.locale] || texts.pt;
    let text = (localeTexts as any)[key] || key;

    // Replace arguments in the text
    args.forEach((arg, index) => {
      text = text
        .replace(`{${index}}`, String(arg))
        .replace(/{name}/g, String(arg))
        .replace(/{[^}]+}/g, (match: string) => {
          const param = match.slice(1, -1);
          return index === 0 ? String(arg) : match;
        });
    });

    return text;
  }

  /**
   * Generate reference ID
   */
  private generateReferenceId(): string {
    return `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Generate HTML content for contact confirmation
   */
  private generateContactConfirmationHTML(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { name, email, phone, message, timestamp } = sanitizedData;

    return `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${this.getLocaleText("contact_confirmation_title")}</title>
    <style>
        body { font-family: ${this.config.fontFamily}; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: ${this.config.primaryColor}; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; }
        .content { padding: 40px 30px; }
        .content h2 { color: ${this.config.primaryColor}; margin-top: 0; }
        .message-details { background-color: #f9f9f9; padding: 20px; border-left: 4px solid ${this.config.secondaryColor}; margin: 20px 0; }
        .footer { background-color: ${this.config.primaryColor}; padding: 20px; text-align: center; color: #ffffff; }
        .footer a { color: #ffffff; text-decoration: none; }
        .contact-info { margin: 20px 0; }
        .contact-info p { margin: 5px 0; }
        @media only screen and (max-width: 600px) {
            .container { width: 100%; }
            .header, .content, .footer { padding: 20px 15px; }
            .header h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${this.config.companyName}</h1>
        </div>
        <div class="content">
            <h2>${this.getLocaleText("confirmation_title", name)}</h2>
            <p>${this.getLocaleText("confirmation_message")}</p>
            
            <div class="message-details">
                <h3>${this.getLocaleText("your_message_details")}</h3>
                <div class="contact-info">
                    <p><strong>${this.getLocaleText("name_label")}:</strong> ${name || "N/A"}</p>
                    <p><strong>${this.getLocaleText("email_label")}:</strong> ${email || "N/A"}</p>
                    ${phone ? `<p><strong>${this.getLocaleText("phone_label")}:</strong> ${phone}</p>` : ""}
                    <p><strong>${this.getLocaleText("date_label")}:</strong> ${timestamp?.toLocaleString("pt-PT") || new Date().toLocaleString("pt-PT")}</p>
                </div>
                ${
                  message
                    ? `
                <h4>${this.getLocaleText("message_label")}:</h4>
                <p>${String(message).replace(/\n/g, "<br>")}</p>
                `
                    : ""
                }
            </div>
            
            <p>${this.getLocaleText("next_steps")}</p>
            <p>${this.getLocaleText("contact_info")}</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.config.companyName}. ${this.getLocaleText("all_rights_reserved")}</p>
            <p>
                <a href="${this.config.website}">${this.getLocaleText("website")}</a> | 
                <a href="tel:${this.config.companyPhone.replace(/\s/g, "")}">${this.config.companyPhone}</a> | 
                <a href="mailto:${this.config.companyEmail}">${this.config.companyEmail}</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML content for contact notification
   */
  private generateContactNotificationHTML(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { name, email, phone, message, timestamp, referenceId } =
      sanitizedData;

    return `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${this.getLocaleText("contact_notification_title")}</title>
    <style>
        body { font-family: ${this.config.fontFamily}; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: ${this.config.secondaryColor}; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; }
        .content { padding: 40px 30px; }
        .content h2 { color: ${this.config.primaryColor}; margin-top: 0; }
        .message-details { background-color: #f9f9f9; padding: 20px; border-left: 4px solid ${this.config.secondaryColor}; margin: 20px 0; }
        .urgent { background-color: #fff3cd; border-left-color: #ffc107; }
        .footer { background-color: ${this.config.primaryColor}; padding: 20px; text-align: center; color: #ffffff; }
        .footer a { color: #ffffff; text-decoration: none; }
        .contact-info { margin: 20px 0; }
        .contact-info p { margin: 5px 0; }
        .reference-id { background-color: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; }
        @media only screen and (max-width: 600px) {
            .container { width: 100%; }
            .header, .content, .footer { padding: 20px 15px; }
            .header h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 ${this.getLocaleText("new_contact_message")}</h1>
        </div>
        <div class="content">
            <h2>${this.getLocaleText("contact_details")}</h2>
            
            <div class="message-details">
                <div class="reference-id">
                    <strong>${this.getLocaleText("reference_id")}:</strong> ${referenceId || this.generateReferenceId()}
                </div>
                
                <div class="contact-info">
                    <p><strong>${this.getLocaleText("name_label")}:</strong> ${name || "N/A"}</p>
                    <p><strong>${this.getLocaleText("email_label")}:</strong> ${email ? `<a href="mailto:${email}">${email}</a>` : "N/A"}</p>
                    ${phone ? `<p><strong>${this.getLocaleText("phone_label")}:</strong> <a href="tel:${String(phone).replace(/\s/g, "")}">${phone}</a></p>` : ""}
                    <p><strong>${this.getLocaleText("date_label")}:</strong> ${timestamp?.toLocaleString("pt-PT") || new Date().toLocaleString("pt-PT")}</p>
                </div>
                
                ${
                  message
                    ? `
                <h4>${this.getLocaleText("message_label")}:</h4>
                <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; margin-top: 10px;">
                    ${String(message).replace(/\n/g, "<br>")}
                </div>
                `
                    : ""
                }
            </div>
            
            <div class="urgent">
                <h3>⚡ ${this.getLocaleText("action_required")}</h3>
                <p>${this.getLocaleText("respond_prompt")}</p>
                <p>
                    <a href="mailto:${email}" style="background-color: ${this.config.primaryColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        ${this.getLocaleText("respond_now")}
                    </a>
                </p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.config.companyName}. ${this.getLocaleText("all_rights_reserved")}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML content for auto-reply
   */
  private generateAutoReplyHTML(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { name } = sanitizedData;

    return `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${this.getLocaleText("auto_reply_title")}</title>
    <style>
        body { font-family: ${this.config.fontFamily}; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #28a745; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; }
        .content { padding: 40px 30px; }
        .content h2 { color: ${this.config.primaryColor}; margin-top: 0; }
        .auto-reply-notice { background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; }
        .business-hours { background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .footer { background-color: ${this.config.primaryColor}; padding: 20px; text-align: center; color: #ffffff; }
        .footer a { color: #ffffff; text-decoration: none; }
        @media only screen and (max-width: 600px) {
            .container { width: 100%; }
            .header, .content, .footer { padding: 20px 15px; }
            .header h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ ${this.getLocaleText("message_received")}</h1>
        </div>
        <div class="content">
            <h2>${this.getLocaleText("auto_reply_greeting", name)}</h2>
            
            <div class="auto-reply-notice">
                <h3>${this.getLocaleText("automatic_response")}</h3>
                <p>${this.getLocaleText("auto_reply_message")}</p>
            </div>
            
            <p>${this.getLocaleText("thank_you_message")}</p>
            
            <div class="business-hours">
                <h3>${this.getLocaleText("business_hours")}</h3>
                <p><strong>${this.getLocaleText("monday_friday")}:</strong> 9:00 - 18:00</p>
                <p><strong>${this.getLocaleText("saturday")}:</strong> 9:00 - 13:00</p>
                <p><strong>${this.getLocaleText("sunday")}:</strong> ${this.getLocaleText("closed")}</p>
            </div>
            
            <h3>${this.getLocaleText("contact_info")}</h3>
            <p>
                <strong>${this.getLocaleText("phone")}:</strong> <a href="tel:${this.config.companyPhone.replace(/\s/g, "")}">${this.config.companyPhone}</a><br>
                <strong>${this.getLocaleText("email")}:</strong> <a href="mailto:${this.config.companyEmail}">${this.config.companyEmail}</a><br>
                <strong>${this.getLocaleText("address")}:</strong> ${this.config.companyAddress}<br>
                <strong>${this.getLocaleText("website")}:</strong> <a href="${this.config.website}">${this.config.website}</a>
            </p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.config.companyName}. ${this.getLocaleText("all_rights_reserved")}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML content for error notification
   */
  private generateErrorNotificationHTML(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { timestamp, referenceId } = sanitizedData;

    return `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${this.getLocaleText("error_notification_title")}</title>
    <style>
        body { font-family: ${this.config.fontFamily}; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #dc3545; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; }
        .content { padding: 40px 30px; }
        .content h2 { color: #dc3545; margin-top: 0; }
        .error-details { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; }
        .footer { background-color: ${this.config.primaryColor}; padding: 20px; text-align: center; color: #ffffff; }
        .footer a { color: #ffffff; text-decoration: none; }
        .reference-id { background-color: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; }
        @media only screen and (max-width: 600px) {
            .container { width: 100%; }
            .header, .content, .footer { padding: 20px 15px; }
            .header h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 ${this.getLocaleText("system_error")}</h1>
        </div>
        <div class="content">
            <h2>${this.getLocaleText("error_occurred")}</h2>
            
            <div class="error-details">
                <div class="reference-id">
                    <strong>${this.getLocaleText("error_id")}:</strong> ${referenceId || this.generateReferenceId()}
                </div>
                
                <p><strong>${this.getLocaleText("timestamp")}:</strong> ${timestamp?.toLocaleString("pt-PT") || new Date().toLocaleString("pt-PT")}</p>
                
                <h3>${this.getLocaleText("error_details")}</h3>
                <p>${String(data.message || this.getLocaleText("no_error_details"))}</p>
            </div>
            
            <h3>${this.getLocaleText("action_required")}</h3>
            <p>${this.getLocaleText("investigate_error")}</p>
            
            <p>
                <a href="${this.config.website}/admin" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    ${this.getLocaleText("view_error_logs")}
                </a>
            </p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.config.companyName}. ${this.getLocaleText("all_rights_reserved")}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML content for newsletter
   */
  private generateNewsletterHTML(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { name } = sanitizedData;

    return `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${this.getLocaleText("newsletter_title")}</title>
    <style>
        body { font-family: ${this.config.fontFamily}; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: ${this.config.primaryColor}; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; }
        .content { padding: 40px 30px; }
        .content h2 { color: ${this.config.primaryColor}; margin-top: 0; }
        .newsletter-content { line-height: 1.6; }
        .featured-products { background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .cta-button { background-color: ${this.config.secondaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
        .footer { background-color: ${this.config.primaryColor}; padding: 20px; text-align: center; color: #ffffff; }
        .footer a { color: #ffffff; text-decoration: none; }
        .unsubscribe { font-size: 12px; margin-top: 20px; }
        @media only screen and (max-width: 600px) {
            .container { width: 100%; }
            .header, .content, .footer { padding: 20px 15px; }
            .header h1 { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 ${this.getLocaleText("newsletter_greeting", name)}</h1>
        </div>
        <div class="content">
            <div class="newsletter-content">
                <h2>${this.getLocaleText("newsletter_title_main")}</h2>
                <p>${this.getLocaleText("newsletter_intro")}</p>
                
                <div class="featured-products">
                    <h3>${this.getLocaleText("featured_products")}</h3>
                    <p>${this.getLocaleText("featured_products_description")}</p>
                    <ul>
                        <li>${this.getLocaleText("product_1")}</li>
                        <li>${this.getLocaleText("product_2")}</li>
                        <li>${this.getLocaleText("product_3")}</li>
                    </ul>
                </div>
                
                <p>${this.getLocaleText("newsletter_call_to_action")}</p>
                <a href="${this.config.website}" class="cta-button">${this.getLocaleText("visit_store")}</a>
                
                <h3>${this.getLocaleText("special_offers")}</h3>
                <p>${this.getLocaleText("special_offers_description")}</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.config.companyName}. ${this.getLocaleText("all_rights_reserved")}</p>
            <p>${this.config.companyAddress} | ${this.config.companyPhone} | <a href="mailto:${this.config.companyEmail}">${this.config.companyEmail}</a></p>
            <div class="unsubscribe">
                <p><a href="${this.config.website}/unsubscribe">${this.getLocaleText("unsubscribe")}</a></p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML content for promotion
   */
  private generatePromotionHTML(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { name } = sanitizedData;

    return `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${this.getLocaleText("promotion_title")}</title>
    <style>
        body { font-family: ${this.config.fontFamily}; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, ${this.config.secondaryColor}, #ff6b6b); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; }
        .content { padding: 40px 30px; text-align: center; }
        .promo-badge { background-color: #ff6b6b; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; font-weight: bold; }
        .discount { font-size: 48px; font-weight: bold; color: ${this.config.secondaryColor}; margin: 20px 0; }
        .promo-description { font-size: 18px; line-height: 1.6; margin: 20px 0; }
        .cta-button { background-color: ${this.config.secondaryColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; display: inline-block; font-size: 18px; font-weight: bold; margin: 20px 0; }
        .footer { background-color: ${this.config.primaryColor}; padding: 20px; text-align: center; color: #ffffff; }
        .footer a { color: #ffffff; text-decoration: none; }
        .expiry-notice { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
        @media only screen and (max-width: 600px) {
            .container { width: 100%; }
            .header, .content, .footer { padding: 20px 15px; }
            .header h1 { font-size: 24px; }
            .discount { font-size: 36px; }
            .cta-button { padding: 12px 24px; font-size: 16px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 ${this.getLocaleText("limited_time_offer")}</h1>
        </div>
        <div class="content">
            <div class="promo-badge">${this.getLocaleText("exclusive_deal")}</div>
            <h2>${this.getLocaleText("promotion_greeting", name)}</h2>
            
            <div class="discount">20% OFF</div>
            
            <div class="promo-description">
                <p>${this.getLocaleText("promotion_description")}</p>
            </div>
            
            <div class="expiry-notice">
                <strong>⏰ ${this.getLocaleText("offer_expiry")}</strong><br>
                ${this.getLocaleText("offer_expiry_details")}
            </div>
            
            <a href="${this.config.website}?promo=NEWSLETTER20" class="cta-button">${this.getLocaleText("shop_now")}</a>
            
            <h3>${this.getLocaleText("how_to_use")}</h3>
            <p>${this.getLocaleText("promo_code_instructions")}</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 18px; margin: 15px 0;">
                NEWSLETTER20
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.config.companyName}. ${this.getLocaleText("all_rights_reserved")}</p>
            <p>${this.config.companyAddress} | <a href="tel:${this.config.companyPhone.replace(/\s/g, "")}">${this.config.companyPhone}</a></p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate text content for contact confirmation
   */
  private generateContactConfirmationText(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { name, email, phone, message, timestamp } = sanitizedData;

    return `
${this.getLocaleText("contact_confirmation_title")}
${"=".repeat(50)}

${this.getLocaleText("confirmation_greeting", name)}

${this.getLocaleText("confirmation_message")}

${this.getLocaleText("your_message_details")}:
${"-".repeat(30)}

${this.getLocaleText("name_label")}: ${name || "N/A"}
${this.getLocaleText("email_label")}: ${email || "N/A"}
${phone ? `${this.getLocaleText("phone_label")}: ${phone}` : ""}
${this.getLocaleText("date_label")}: ${timestamp?.toLocaleString("pt-PT") || new Date().toLocaleString("pt-PT")}

${
  message
    ? `
${this.getLocaleText("message_label")}:
${"-".repeat(20)}
${String(message)}
`
    : ""
}

${this.getLocaleText("next_steps")}

${this.getLocaleText("contact_info")}

${"-".repeat(50)}
${this.config.companyName}
${this.config.companyAddress}
${this.config.companyPhone}
${this.config.companyEmail}
${this.config.website}
`;
  }

  /**
   * Generate text content for contact notification
   */
  private generateContactNotificationText(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { name, email, phone, message, timestamp, referenceId } =
      sanitizedData;

    return `
${this.getLocaleText("new_contact_message").toUpperCase()}
${"=".repeat(50)}

${this.getLocaleText("reference_id")}: ${referenceId || this.generateReferenceId()}

${this.getLocaleText("contact_details")}:
${"-".repeat(30)}

${this.getLocaleText("name_label")}: ${name || "N/A"}
${this.getLocaleText("email_label")}: ${email || "N/A"}
${phone ? `${this.getLocaleText("phone_label")}: ${phone}` : ""}
${this.getLocaleText("date_label")}: ${timestamp?.toLocaleString("pt-PT") || new Date().toLocaleString("pt-PT")}

${
  message
    ? `
${this.getLocaleText("message_label")}:
${"-".repeat(20)}
${String(message)}
`
    : ""
}

${this.getLocaleText("action_required").toUpperCase()}
${"-".repeat(25)}
${this.getLocaleText("respond_prompt")}

${this.getLocaleText("respond_now").toLowerCase()}: ${email}
`;
  }

  /**
   * Generate text content for auto-reply
   */
  private generateAutoReplyText(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { name } = sanitizedData;

    return `
${this.getLocaleText("message_received").toUpperCase()}
${"=".repeat(50)}

${this.getLocaleText("auto_reply_greeting", name)}

${this.getLocaleText("automatic_response")}
${this.getLocaleText("auto_reply_message")}

${this.getLocaleText("thank_you_message")}

${this.getLocaleText("business_hours").toUpperCase()}:
${"-".repeat(20)}
${this.getLocaleText("monday_friday")}: 9:00 - 18:00
${this.getLocaleText("saturday")}: 9:00 - 13:00
${this.getLocaleText("sunday")}: ${this.getLocaleText("closed")}

${this.getLocaleText("contact_info").toUpperCase()}:
${"-".repeat(20)}
${this.getLocaleText("phone")}: ${this.config.companyPhone}
${this.getLocaleText("email")}: ${this.config.companyEmail}
${this.getLocaleText("address")}: ${this.config.companyAddress}
${this.getLocaleText("website")}: ${this.config.website}

${"-".repeat(50)}
${this.config.companyName}
${this.getLocaleText("all_rights_reserved")}
`;
  }

  /**
   * Generate text content for error notification
   */
  private generateErrorNotificationText(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { timestamp, referenceId } = sanitizedData;

    return `
${this.getLocaleText("system_error").toUpperCase()}
${"=".repeat(50)}

${this.getLocaleText("error_occurred")}

${this.getLocaleText("error_id")}: ${referenceId || this.generateReferenceId()}
${this.getLocaleText("timestamp")}: ${timestamp?.toLocaleString("pt-PT") || new Date().toLocaleString("pt-PT")}

${this.getLocaleText("error_details").toUpperCase()}:
${"-".repeat(20)}
${String(data.message || this.getLocaleText("no_error_details"))}

${this.getLocaleText("action_required").toUpperCase()}:
${"-".repeat(25)}
${this.getLocaleText("investigate_error")}

${this.getLocaleText("view_error_logs").toLowerCase()}: ${this.config.website}/admin

${"-".repeat(50)}
${this.config.companyName} - ${this.getLocaleText("system_alert")}
`;
  }

  /**
   * Generate text content for newsletter
   */
  private generateNewsletterText(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { name } = sanitizedData;

    return `
${this.getLocaleText("newsletter_title").toUpperCase()}
${"=".repeat(50)}

${this.getLocaleText("newsletter_greeting", name)}

${this.getLocaleText("newsletter_intro")}

${this.getLocaleText("featured_products").toUpperCase()}:
${"-".repeat(30)}
• ${this.getLocaleText("product_1")}
• ${this.getLocaleText("product_2")}
• ${this.getLocaleText("product_3")}

${this.getLocaleText("newsletter_call_to_action")}

${this.getLocaleText("special_offers").toUpperCase()}:
${"-".repeat(25)}
${this.getLocaleText("special_offers_description")}

${this.getLocaleText("visit_store").toUpperCase()}: ${this.config.website}

${"-".repeat(50)}
${this.config.companyName}
${this.config.companyAddress}
${this.config.companyPhone}
${this.config.companyEmail}

${this.getLocaleText("unsubscribe")}: ${this.config.website}/unsubscribe
`;
  }

  /**
   * Generate text content for promotion
   */
  private generatePromotionText(data: EmailTemplateData): string {
    const sanitizedData = this.sanitizeData(data);
    const { name } = sanitizedData;

    return `
🎉 ${this.getLocaleText("limited_time_offer").toUpperCase()} 🎉
${"=".repeat(50)}

${this.getLocaleText("promotion_greeting", name)}

${this.getLocaleText("exclusive_deal").toUpperCase()}

20% OFF - ${this.getLocaleText("promotion_description")}

${this.getLocaleText("offer_expiry").toUpperCase()}:
${this.getLocaleText("offer_expiry_details")}

${this.getLocaleText("how_to_use").toUpperCase()}:
${this.getLocaleText("promo_code_instructions")}

PROMO CODE: NEWSLETTER20

${this.getLocaleText("shop_now").toUpperCase()}: ${this.config.website}?promo=NEWSLETTER20

${"-".repeat(50)}
${this.config.companyName}
${this.config.companyAddress}
${this.config.companyPhone}
`;
  }

  /**
   * Clear template cache
   */
  public clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.templateCache.size,
      keys: Array.from(this.templateCache.keys()),
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<EmailTemplateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.clearCache(); // Clear cache when config changes
  }

  /**
   * Get current configuration
   */
  public getConfig(): EmailTemplateConfig {
    return { ...this.config };
  }
}

/**
 * Default email template manager instance
 */
export const defaultEmailTemplateManager = new EmailTemplateManager();

/**
 * Convenience function for quick template generation
 */
export function generateEmailTemplate(
  type: TemplateType,
  data: EmailTemplateData = {},
  config?: Partial<EmailTemplateConfig>,
): EmailTemplate {
  const manager = config
    ? new EmailTemplateManager(config)
    : defaultEmailTemplateManager;
  return manager.generateTemplate(type, data);
}
