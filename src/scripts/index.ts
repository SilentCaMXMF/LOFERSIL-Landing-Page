/**
 * LOFERSIL Landing Page - Main TypeScript Entry Point
 * Orchestrates modular components for navigation, interactions, and dynamic content loading
 */

// DOMPurify is loaded globally from CDN

// Import modules
import { ErrorHandler } from './modules/ErrorHandler.js';
import { NavigationManager } from './modules/NavigationManager.js';
import { SEOManager } from './modules/SEOManager.js';
import { PerformanceTracker } from './modules/PerformanceTracker.js';
import { UIManager } from './modules/UIManager.js';
import { createContactForm } from './modules/ContactFormManager.js';

// Development mode check for logging
const IS_DEVELOPMENT =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Window interface extensions for analytics and debugging
declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: object) => void;
    getWebVitals?: () => void;
  }

  // DOMPurify global
  var DOMPurify: {
    sanitize: (html: string) => string;
  };
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

// Types
interface NavigationConfig {
  mobileBreakpoint: number;
  scrollThreshold: number;
}

interface Route {
  title: string;
  description: string;
  content: string;
}

// Configuration
const navigationConfig: NavigationConfig = {
  mobileBreakpoint: 768,
  scrollThreshold: 100,
};

const uiConfig = {
  scrollThreshold: 100,
  contactFormSelector: 'form[action="/api/contact"]',
};

const seoConfig = {
  siteName: 'LOFERSIL',
  defaultTitle: 'LOFERSIL - Produtos e Serviços Premium',
  defaultDescription:
    'LOFERSIL - Produtos e serviços premium. Descubra a nossa coleção e encontre o que procura.',
  siteUrl: window.location.origin,
};

const performanceConfig = {
  enableWebVitals: false, // Temporarily disabled to fix build issues
  enableAnalytics: typeof window.gtag !== 'undefined',
  analyticsId: 'GA_MEASUREMENT_ID', // Replace with actual GA ID
};

// Routes configuration
const routes: Record<string, Route> = {
  '/': {
    title: 'LOFERSIL - Produtos e Serviços Premium',
    description:
      'LOFERSIL - Produtos e serviços premium. Descubra a nossa coleção e encontre o que procura.',
    content: `
      <section id="hero" class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title">Bem-vindo à LOFERSIL</h1>
            <p class="hero-subtitle">Produtos e Serviços Premium</p>
            <p class="hero-description">
              Descubra a nossa coleção selecionada de produtos de alta qualidade e serviços
              excecionais. Experimente a excelência em tudo o que oferecemos.
            </p>
            <div class="hero-actions">
              <a href="/products" class="btn btn-primary">Explorar Produtos</a>
              <a href="/services" class="btn btn-secondary">Nossos Serviços</a>
            </div>
          </div>
          <div class="hero-image">
            <img src="/assets/images/hero-image.svg" alt="LOFERSIL Hero" class="hero-img" loading="lazy" />
          </div>
        </div>
      </section>

      <section id="features" class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Porquê Escolher LOFERSIL?</h2>
             <p class="section-subtitle">Qualidade, fiabilidade e excelência em todos os aspetos</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">⭐</div>
              <h3 class="feature-title">Qualidade Premium</h3>
               <p class="feature-description">Apenas os melhores produtos e serviços fazem parte da nossa coleção.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚀</div>
              <h3 class="feature-title">Rápido e Fiável</h3>
               <p class="feature-description">Entrega rápida e serviço confiável em que pode contar.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💎</div>
              <h3 class="feature-title">Suporte Excecional</h3>
               <p class="feature-description">A nossa equipa está aqui para ajudar em todos os passos.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" class="cta">
        <div class="cta-container">
          <div class="cta-content">
            <h2 class="cta-title">Pronto para Começar?</h2>
            <p class="cta-description">
              Visite nossa loja para explorar nossa coleção completa de produtos e serviços premium.
            </p>
            <a href="/store" class="btn btn-primary btn-large">Visitar Nossa Loja</a>
          </div>
        </div>
      </section>
    `,
  },
  '/products': {
    title: 'Produtos - LOFERSIL',
    description:
      'Explore nossa coleção premium de produtos. Artigos de alta qualidade selecionados para clientes exigentes.',
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title">Nossos Produtos</h1>
            <p class="hero-subtitle">Coleção Premium</p>
            <p class="hero-description">
              Descubra nossa seleção cuidadosa de produtos de alta qualidade desenhados para satisfazer suas necessidades.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Categorias de Produtos</h2>
             <p class="section-subtitle">Encontre exatamente o que procura</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📱</div>
              <h3 class="feature-title">Eletrónicos</h3>
               <p class="feature-description">Última tecnologia e dispositivos para a vida moderna.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">👕</div>
              <h3 class="feature-title">Moda</h3>
               <p class="feature-description">Roupa elegante e confortável para todas as ocasiões.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🏠</div>
              <h3 class="feature-title">Casa e Jardim</h3>
               <p class="feature-description">Tudo o que precisa para tornar seu espaço bonito.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎮</div>
              <h3 class="feature-title">Entretenimento</h3>
               <p class="feature-description">Produtos divertidos e envolventes para o tempo livre.</p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  '/services': {
    title: 'Serviços - LOFERSIL',
    description:
      'Serviços profissionais adaptados às suas necessidades. Soluções especializadas para empresas e indivíduos.',
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title">Nossos Serviços</h1>
            <p class="hero-subtitle">Soluções Especializadas</p>
            <p class="hero-description">
              Serviços profissionais desenhados para ajudar a alcançar seus objetivos com excelência.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Áreas de Serviço</h2>
             <p class="section-subtitle">Soluções abrangentes para suas necessidades</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">💼</div>
              <h3 class="feature-title">Consultoria</h3>
               <p class="feature-description">Aconselhamento especializado e serviços de planejamento estratégico.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔧</div>
              <h3 class="feature-title">Suporte Técnico</h3>
               <p class="feature-description">Assistência técnica fiável e manutenção.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3 class="feature-title">Análise</h3>
               <p class="feature-description">Informações baseadas em dados para otimizar seu desempenho.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎨</div>
              <h3 class="feature-title">Design</h3>
               <p class="feature-description">Soluções de design criativo para seus projetos.</p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  '/about': {
    title: 'Sobre Nós - LOFERSIL',
    description:
      'Conheça a missão, valores e compromisso com a qualidade da LOFERSIL. Descubra nossa história.',
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title">Sobre a LOFERSIL</h1>
            <p class="hero-subtitle">Nossa História</p>
            <p class="hero-description">
              Fundada com paixão pela qualidade e excelência, a LOFERSIL está comprometida em fornecer produtos e serviços premium.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Nossa Missão</h2>
             <p class="section-subtitle">Entregar excelência em tudo o que fazemos</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <h3 class="feature-title">Qualidade Primeiro</h3>
               <p class="feature-description">Priorizamos a qualidade em todos os produtos e serviços que oferecemos.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🤝</div>
              <h3 class="feature-title">Foco no Cliente</h3>
               <p class="feature-description">Sua satisfação é nossa prioridade máxima.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌟</div>
              <h3 class="feature-title">Inovação</h3>
               <p class="feature-description">Melhorando continuamente e adaptando-nos para satisfazer suas necessidades.</p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  '/contact': {
    title: 'Contacte-nos - LOFERSIL',
    description:
      'Entre em contacto com a LOFERSIL. Estamos aqui para ajudar com quaisquer perguntas ou suporte de que necessite.',
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title">Contacte-nos</h1>
            <p class="hero-subtitle">Entre em Contacto</p>
            <p class="hero-description">
              Tem perguntas? Precisa de suporte? Estamos aqui para ajudar em todos os passos.
            </p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Informações de Contacto</h2>
             <p class="section-subtitle">Contacte-nos através de qualquer um destes canais</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📧</div>
              <h3 class="feature-title">Email</h3>
               <p class="feature-description">info@lofersil.com</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📞</div>
              <h3 class="feature-title">Telefone</h3>
               <p class="feature-description">+351 21 123 4567</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📍</div>
              <h3 class="feature-title">Endereço</h3>
               <p class="feature-description">R. Gomes Freire 187 B, 1150-178 Lisboa</p>
            </div>
          </div>
        </div>
      </section>
    `,
  },
  '/store': {
    title: 'Loja - LOFERSIL',
    description:
      'Visite nossa loja online para navegar e comprar nossa coleção completa de produtos premium.',
    content: `
      <section class="hero">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title">Nossa Loja</h1>
             <p class="hero-subtitle">Experiência de Compras Premium</p>
             <p class="hero-description">Navegue pela nossa coleção completa de produtos premium. Artigos de qualidade a preços competitivos.</p>
            <div class="hero-actions">
               <a href="/products" class="btn btn-primary">Navegar Produtos</a>
               <a href="/contact" class="btn btn-secondary">Contactar Vendas</a>
            </div>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-container">
          <div class="section-header">
            <h2 class="section-title">Características da Loja</h2>
             <p class="section-subtitle">Porquê comprar connosco</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🛒</div>
              <h3 class="feature-title">Compras Fáceis</h3>
               <p class="feature-description">Interface intuitiva para uma experiência de compras sem interrupções.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🚚</div>
              <h3 class="feature-title">Entrega Rápida</h3>
               <p class="feature-description">Entrega rápida e fiável à sua porta.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3 class="feature-title">Pagamento Seguro</h3>
               <p class="feature-description">Processamento de pagamentos seguro e protegido.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💯</div>
              <h3 class="feature-title">Garantia de Qualidade</h3>
               <p class="feature-description">Garantia de satisfação de 100% em todas as compras.</p>
            </div>
          </div>
        </div>
      </section>
     `,
  },
  '/privacy': {
    title: 'Política de Privacidade - LOFERSIL',
    description:
      'Política de Privacidade da LOFERSIL - Saiba como protegemos seus dados pessoais e informações.',
    content: `
       <section class="hero">
         <div class="hero-container">
           <div class="hero-content">
             <h1 class="hero-title">Política de Privacidade</h1>
             <p class="hero-subtitle">Compromisso com a sua privacidade</p>
             <p class="hero-description">
               Na LOFERSIL, valorizamos a sua privacidade e estamos comprometidos em proteger
               as suas informações pessoais. Esta política explica como recolhemos, utilizamos
               e protegemos os seus dados.
             </p>
           </div>
         </div>
       </section>

       <section class="privacy-policy">
         <div class="container">
           <div class="privacy-content">
             <div class="privacy-section">
               <h2 class="privacy-title">1. Introdução</h2>
               <p class="privacy-text">
                 A presente Política de Privacidade regula a recolha, tratamento e proteção
                 dos dados pessoais dos utilizadores do website da LOFERSIL (www.lofersil.pt).
                 Ao utilizar o nosso website, concorda com as práticas descritas nesta política.
               </p>
             </div>

             <div class="privacy-section">
               <h2 class="privacy-title">2. Dados que Recolhemos</h2>
               <p class="privacy-text">
                 Atualmente, o nosso website não inclui formulários de contacto ou registo.
                 Recolhemos apenas informações técnicas básicas através de cookies para melhorar
                 a sua experiência de navegação.
               </p>
             </div>

             <div class="privacy-section">
               <h2 class="privacy-title">3. Cookies</h2>
               <p class="privacy-text">
                 Utilizamos cookies técnicos para o funcionamento básico do website e cookies
                 de analytics para analisar o tráfego. Pode gerir as suas preferências de cookies
                 através das definições do seu navegador.
               </p>
             </div>

             <div class="privacy-section">
               <h2 class="privacy-title">4. Contacto</h2>
               <p class="privacy-text">
                 Para questões sobre privacidade, contacte-nos através de info@lofersil.pt
                 ou visite a nossa loja em Rua Gomes Freire 187 B, Lisboa.
               </p>
             </div>
           </div>
         </div>
       </section>
     `,
  },
  '/terms': {
    title: 'Termos de Serviço - LOFERSIL',
    description: 'Termos de Serviço da LOFERSIL - Condições de utilização do website e serviços.',
    content: `
       <section class="hero">
         <div class="hero-container">
           <div class="hero-content">
             <h1 class="hero-title">Termos de Serviço</h1>
             <p class="hero-subtitle">Condições de utilização</p>
             <p class="hero-description">
               Estes termos regulam a utilização do website da LOFERSIL e os serviços
               oferecidos. Ao utilizar o nosso website, concorda com estes termos.
             </p>
           </div>
         </div>
       </section>

       <section class="privacy-policy">
         <div class="container">
           <div class="privacy-content">
             <div class="privacy-section">
               <h2 class="privacy-title">1. Aceitação dos Termos</h2>
               <p class="privacy-text">
                 Ao aceder e utilizar o website da LOFERSIL, concorda em cumprir estes
                 Termos de Serviço.
               </p>
             </div>

             <div class="privacy-section">
               <h2 class="privacy-title">2. Descrição do Serviço</h2>
               <p class="privacy-text">
                 A LOFERSIL oferece uma landing page informativa sobre os nossos produtos
                 e serviços. Somos uma loja física especializada em artigos de papelaria,
                 produtos para bebés, joias e material de escritório.
               </p>
             </div>

             <div class="privacy-section">
               <h2 class="privacy-title">3. Utilização do Website</h2>
               <p class="privacy-text">
                 Pode utilizar o nosso website para obter informações sobre produtos e serviços,
                 contactar-nos e visitar a nossa loja física.
               </p>
             </div>

             <div class="privacy-section">
               <h2 class="privacy-title">4. Propriedade Intelectual</h2>
               <p class="privacy-text">
                 Todo o conteúdo do website é propriedade da LOFERSIL e está protegido
                 por leis de direitos de autor.
               </p>
             </div>

             <div class="privacy-section">
               <h2 class="privacy-title">5. Contacto</h2>
               <p class="privacy-text">
                 Para questões, contacte-nos através de info@lofersil.pt ou visite
                 a nossa loja em Lisboa.
               </p>
             </div>
           </div>
         </div>
       </section>
     `,
  },
};

/**
 * Main application class - Orchestrates all modules
 */
class LOFERSILLandingPage {
  private errorHandler: ErrorHandler;
  private navigationManager: NavigationManager;
  private seoManager: SEOManager;
  private performanceTracker: PerformanceTracker;
  private uiManager: UIManager;
  private contactForm = createContactForm();

  constructor() {
    // Initialize error handler first
    this.errorHandler = new ErrorHandler();

    // Initialize other modules
    this.navigationManager = new NavigationManager(navigationConfig, routes, this.errorHandler);
    this.seoManager = new SEOManager(seoConfig, this.errorHandler);
    this.performanceTracker = new PerformanceTracker(performanceConfig, this.errorHandler);
    this.uiManager = new UIManager(uiConfig, this.errorHandler);

    this.initializeApp();
  }

  /**
   * Initialize the application
   */
  private async initializeApp(): Promise<void> {
    try {
      // Setup cross-module event listeners
      this.setupCrossModuleEvents();

      // Application initialized successfully
      if (IS_DEVELOPMENT) {
        console.info('LOFERSIL Landing Page initialized successfully');
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'Application initialization failed');
    }
  }

  /**
   * Setup cross-module event coordination
   */
  private setupCrossModuleEvents(): void {
    // When page is rendered, update SEO
    window.addEventListener('pageRendered', (event: Event) => {
      const customEvent = event as CustomEvent<{ path: string; route: Route }>;
      const { path, route } = customEvent.detail;
      this.seoManager.updateMetaTags(route.title, route.description);
      this.performanceTracker.trackPageView(path);
    });
  }

  /**
   * Get web vitals metrics (public API for debugging)
   */
  public getWebVitalsMetrics(): unknown {
    return this.performanceTracker.getWebVitalsMetrics();
  }

  /**
   * Navigate to a specific path
   */
  public navigateTo(path: string): void {
    this.navigationManager.navigateTo(path);
  }

  /**
   * Get current path
   */
  public getCurrentPath(): string {
    return this.navigationManager.getCurrentPath();
  }
}

// Utility functions
const utils = {
  /**
   * Debounce function for performance optimization
   */
  debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
    let timeout: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  },

  /**
   * Throttle function for scroll events
   */
  throttle<T extends (...args: unknown[]) => unknown>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },

  /**
   * Check if element is in viewport
   */
  isInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },
};

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new LOFERSILLandingPage();
    // Expose metrics globally for debugging
    window.getWebVitals = () => app.getWebVitalsMetrics();
  });
} else {
  const app = new LOFERSILLandingPage();
  // Expose metrics globally for debugging
  window.getWebVitals = () => app.getWebVitalsMetrics();
}

// Export for potential module usage
export { LOFERSILLandingPage, utils };
