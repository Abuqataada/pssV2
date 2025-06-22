import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertInvestmentSchema, insertWithdrawalSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Extend session data interface
declare module "express-session" {
  interface SessionData {
    userId: number;
    isAdmin: boolean;
  }
}

// Session configuration
const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
const pgStore = connectPg(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    }),
    secret: process.env.SESSION_SECRET || "pss-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUserById(req.session.userId!);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Validate referral code if provided
      if (userData.referredBy) {
        const referrer = await storage.getUserByReferralCode(userData.referredBy);
        if (!referrer) {
          return res.status(400).json({ message: "Invalid referral code" });
        }
        
        // Check category restrictions
        const categoryOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite'];
        const referrerCategoryIndex = categoryOrder.indexOf(referrer.category);
        const userCategoryIndex = categoryOrder.indexOf(userData.category);
        
        if (userCategoryIndex > referrerCategoryIndex + 1) {
          return res.status(400).json({ 
            message: "You can only be referred to the same category or one level below the referrer" 
          });
        }
      }

      const user = await storage.createUser(userData);
      
      // Create referral record if applicable
      if (userData.referredBy) {
        const referrer = await storage.getUserByReferralCode(userData.referredBy);
        if (referrer) {
          const commissionRates = {
            bronze: 5, silver: 7, gold: 9, platinum: 10, diamond: 11, elite: 12.5
          };
          
          await storage.createReferral({
            referrerId: referrer.id,
            referredId: user.id,
            commissionRate: commissionRates[referrer.category as keyof typeof commissionRates].toString(),
            commissionEarned: "0",
            isActive: true,
          });
        }
      }

      // Auto-login after registration
      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin || false;
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin || false;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Investment routes
  app.post("/api/investments", requireAuth, async (req, res) => {
    try {
      const investmentData = insertInvestmentSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      
      // Calculate maturity date
      const startDate = new Date();
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + investmentData.duration);
      
      const investment = await storage.createInvestment({
        ...investmentData,
        maturityDate,
      });
      
      // Create transaction record
      await storage.createTransaction({
        userId: req.session.userId!,
        type: "deposit",
        amount: investmentData.amount,
        reference: `INV-${investment.id}-${Date.now()}`,
        status: "completed",
        description: `Investment in ${investmentData.category} package`,
        metadata: { investmentId: investment.id },
      });

      // Check for category upgrade eligibility
      await storage.checkAndUpgradeUserCategory(req.session.userId!);
      
      res.json(investment);
    } catch (error: any) {
      console.error("Investment creation error:", error);
      res.status(400).json({ message: error.message || "Failed to create investment" });
    }
  });

  app.get("/api/investments", requireAuth, async (req, res) => {
    try {
      const investments = await storage.getUserInvestments(req.session.userId!);
      res.json(investments);
    } catch (error) {
      console.error("Get investments error:", error);
      res.status(500).json({ message: "Failed to get investments" });
    }
  });

  // Withdrawal routes
  app.post("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const withdrawalData = insertWithdrawalSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      
      const withdrawal = await storage.createWithdrawalRequest(withdrawalData);
      res.json(withdrawal);
    } catch (error: any) {
      console.error("Withdrawal request error:", error);
      res.status(400).json({ message: error.message || "Failed to create withdrawal request" });
    }
  });

  app.get("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const withdrawals = await storage.getUserWithdrawals(req.session.userId!);
      res.json(withdrawals);
    } catch (error) {
      console.error("Get withdrawals error:", error);
      res.status(500).json({ message: "Failed to get withdrawals" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/referrals/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getReferralStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      console.error("Get referral stats error:", error);
      res.status(500).json({ message: "Failed to get referral stats" });
    }
  });

  // Advanced features routes
  app.get("/api/referrals/tree", requireAuth, async (req, res) => {
    try {
      const tree = await storage.getReferralTree(req.session.userId!);
      res.json(tree);
    } catch (error) {
      console.error("Get referral tree error:", error);
      res.status(500).json({ message: "Failed to get referral tree" });
    }
  });

  app.get("/api/analytics/advanced", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const analytics = await storage.getAdvancedAnalytics(start, end);
      res.json(analytics);
    } catch (error) {
      console.error("Get advanced analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    try {
      const withdrawals = await storage.getAllWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      console.error("Get all withdrawals error:", error);
      res.status(500).json({ message: "Failed to get withdrawals" });
    }
  });

  app.patch("/api/admin/withdrawals/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      const withdrawal = await storage.updateWithdrawalStatus(
        parseInt(id), 
        status, 
        adminNotes
      );
      res.json(withdrawal);
    } catch (error) {
      console.error("Update withdrawal error:", error);
      res.status(500).json({ message: "Failed to update withdrawal" });
    }
  });

  // Paystack webhook (for payment verification)
  app.post("/api/paystack/webhook", async (req, res) => {
    try {
      // Verify Paystack signature
      const hash = require('crypto')
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (hash !== req.headers['x-paystack-signature']) {
        return res.status(400).json({ message: "Invalid signature" });
      }
      
      const { event, data } = req.body;
      
      if (event === 'charge.success') {
        // Update transaction status
        await storage.createTransaction({
          userId: data.metadata.userId,
          type: "deposit",
          amount: (data.amount / 100).toString(), // Paystack amount is in kobo
          reference: data.reference,
          status: "completed",
          description: "Investment deposit via Paystack",
          metadata: data.metadata,
        });
      }
      
      res.status(200).json({ message: "Webhook processed" });
    } catch (error) {
      console.error("Paystack webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
