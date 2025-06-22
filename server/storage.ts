import {
  users,
  investmentPackages,
  referrals,
  withdrawalRequests,
  transactions,
  categoryUpgrades,
  analyticsEvents,
  type User,
  type InsertUser,
  type InvestmentPackage,
  type InsertInvestment,
  type Referral,
  type WithdrawalRequest,
  type InsertWithdrawal,
  type Transaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sum, sql, gte, lte } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Investment operations
  createInvestment(investment: InsertInvestment): Promise<InvestmentPackage>;
  getUserInvestments(userId: number): Promise<InvestmentPackage[]>;
  getInvestmentById(id: number): Promise<InvestmentPackage | undefined>;
  updateInvestment(id: number, updates: Partial<InvestmentPackage>): Promise<InvestmentPackage>;
  getAllInvestments(): Promise<InvestmentPackage[]>;
  
  // Referral operations
  createReferral(referral: Omit<Referral, 'id' | 'createdAt'>): Promise<Referral>;
  getUserReferrals(userId: number): Promise<Referral[]>;
  getReferralStats(userId: number): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    totalCommissions: number;
  }>;
  
  // Withdrawal operations
  createWithdrawalRequest(withdrawal: InsertWithdrawal): Promise<WithdrawalRequest>;
  getUserWithdrawals(userId: number): Promise<WithdrawalRequest[]>;
  getAllWithdrawals(): Promise<WithdrawalRequest[]>;
  updateWithdrawalStatus(id: number, status: string, adminNotes?: string): Promise<WithdrawalRequest>;
  
  // Transaction operations
  createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Dashboard stats
  getUserStats(userId: number): Promise<{
    totalInvestment: number;
    totalReturns: number;
    totalReferrals: number;
    totalCommissions: number;
  }>;
  
  getAdminStats(): Promise<{
    totalUsers: number;
    totalInvested: string;
    pendingWithdrawals: number;
    monthlyGrowth: number;
  }>;
  
  // Advanced features
  checkAndUpgradeUserCategory(userId: number): Promise<void>;
  getReferralTree(userId: number): Promise<any>;
  getAdvancedAnalytics(startDate?: Date, endDate?: Date): Promise<any>;
  createAnalyticsEvent(event: { userId?: number; eventType: string; eventData?: any; ipAddress?: string; userAgent?: string }): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const referralCode = this.generateReferralCode(userData.fullName);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
        referralCode,
      })
      .returning();
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createInvestment(investmentData: InsertInvestment): Promise<InvestmentPackage> {
    const [investment] = await db
      .insert(investmentPackages)
      .values(investmentData)
      .returning();
    return investment;
  }

  async getUserInvestments(userId: number): Promise<InvestmentPackage[]> {
    return await db
      .select()
      .from(investmentPackages)
      .where(eq(investmentPackages.userId, userId))
      .orderBy(desc(investmentPackages.createdAt));
  }

  async getInvestmentById(id: number): Promise<InvestmentPackage | undefined> {
    const [investment] = await db
      .select()
      .from(investmentPackages)
      .where(eq(investmentPackages.id, id));
    return investment;
  }

  async updateInvestment(id: number, updates: Partial<InvestmentPackage>): Promise<InvestmentPackage> {
    const [investment] = await db
      .update(investmentPackages)
      .set(updates)
      .where(eq(investmentPackages.id, id))
      .returning();
    return investment;
  }

  async getAllInvestments(): Promise<InvestmentPackage[]> {
    return await db.select().from(investmentPackages).orderBy(desc(investmentPackages.createdAt));
  }

  async createReferral(referralData: Omit<Referral, 'id' | 'createdAt'>): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values(referralData)
      .returning();
    return referral;
  }

  async getUserReferrals(userId: number): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));
  }

  async getReferralStats(userId: number): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    totalCommissions: number;
  }> {
    const totalReferrals = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    const activeReferrals = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(and(eq(referrals.referrerId, userId), eq(referrals.isActive, true)));

    const totalCommissions = await db
      .select({ sum: sql<number>`coalesce(sum(commission_earned), 0)` })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    return {
      totalReferrals: totalReferrals[0]?.count || 0,
      activeReferrals: activeReferrals[0]?.count || 0,
      totalCommissions: Number(totalCommissions[0]?.sum || 0),
    };
  }

  async createWithdrawalRequest(withdrawalData: InsertWithdrawal): Promise<WithdrawalRequest> {
    const [withdrawal] = await db
      .insert(withdrawalRequests)
      .values(withdrawalData)
      .returning();
    return withdrawal;
  }

  async getUserWithdrawals(userId: number): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.requestedAt));
  }

  async getAllWithdrawals(): Promise<WithdrawalRequest[]> {
    return await db.select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.requestedAt));
  }

  async updateWithdrawalStatus(id: number, status: string, adminNotes?: string): Promise<WithdrawalRequest> {
    const [withdrawal] = await db
      .update(withdrawalRequests)
      .set({ 
        status, 
        adminNotes, 
        processedAt: new Date() 
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return withdrawal;
  }

  async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getUserStats(userId: number): Promise<{
    totalInvestment: number;
    totalReturns: number;
    totalReferrals: number;
    totalCommissions: number;
  }> {
    const investments = await db
      .select({ sum: sql<number>`coalesce(sum(amount), 0)` })
      .from(investmentPackages)
      .where(eq(investmentPackages.userId, userId));

    const returns = await db
      .select({ sum: sql<number>`coalesce(sum(total_earned), 0)` })
      .from(investmentPackages)
      .where(eq(investmentPackages.userId, userId));

    const referralStats = await this.getReferralStats(userId);

    return {
      totalInvestment: Number(investments[0]?.sum || 0),
      totalReturns: Number(returns[0]?.sum || 0),
      totalReferrals: referralStats.totalReferrals,
      totalCommissions: referralStats.totalCommissions,
    };
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalInvested: string;
    pendingWithdrawals: number;
    monthlyGrowth: number;
  }> {
    const totalUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const totalInvested = await db
      .select({ sum: sql<number>`coalesce(sum(amount), 0)` })
      .from(investmentPackages);

    const pendingWithdrawals = await db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.status, 'pending'));

    // Simple monthly growth calculation (mock for now)
    const monthlyGrowth = 12.5;

    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalInvested: `₦${Number(totalInvested[0]?.sum || 0).toLocaleString()}`,
      pendingWithdrawals: pendingWithdrawals[0]?.count || 0,
      monthlyGrowth,
    };
  }

  // Advanced features implementation
  async checkAndUpgradeUserCategory(userId: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) return;

    const totalInvestment = await db
      .select({ sum: sql<number>`coalesce(sum(amount), 0)` })
      .from(investmentPackages)
      .where(eq(investmentPackages.userId, userId));

    const total = Number(totalInvestment[0]?.sum || 0);
    
    const upgradeThresholds = {
      bronze: { threshold: 0, next: null },
      silver: { threshold: 10000, next: 'silver' },
      gold: { threshold: 50000, next: 'gold' },
      platinum: { threshold: 200000, next: 'platinum' },
      diamond: { threshold: 1000000, next: 'diamond' },
      elite: { threshold: 10000000, next: 'elite' }
    };

    const currentCategory = user.category;
    let newCategory = currentCategory;

    for (const [category, config] of Object.entries(upgradeThresholds)) {
      if (total >= config.threshold && config.next && 
          this.getCategoryLevel(config.next) > this.getCategoryLevel(currentCategory)) {
        newCategory = config.next;
      }
    }

    if (newCategory !== currentCategory) {
      await this.updateUser(userId, { category: newCategory });
      
      await db.insert(categoryUpgrades).values({
        userId,
        fromCategory: currentCategory,
        toCategory: newCategory,
        upgradeReason: `Automatic upgrade based on total investment of ₦${total.toLocaleString()}`,
        totalInvestmentThreshold: total.toString(),
      });
    }
  }

  async getReferralTree(userId: number): Promise<any> {
    const user = await this.getUserById(userId);
    if (!user) return null;

    const buildTree = async (nodeUserId: number, depth = 0): Promise<any> => {
      if (depth > 5) return null; // Prevent infinite recursion

      const nodeUser = await this.getUserById(nodeUserId);
      if (!nodeUser) return null;

      const directReferrals = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          category: users.category,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.referredBy, nodeUser.referralCode || ''));

      const children = await Promise.all(
        directReferrals.map(ref => buildTree(ref.id, depth + 1))
      );

      return {
        id: nodeUser.id,
        name: nodeUser.fullName,
        category: nodeUser.category,
        referralCode: nodeUser.referralCode,
        joinDate: nodeUser.createdAt,
        children: children.filter(Boolean),
        stats: {
          directReferrals: directReferrals.length,
          totalDownline: await this.getTotalDownlineCount(nodeUserId),
        }
      };
    };

    return await buildTree(userId);
  }

  async getAdvancedAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const [
      userGrowth,
      investmentTrends,
      categoryDistribution,
      topReferrers,
      revenueAnalytics
    ] = await Promise.all([
      this.getUserGrowthAnalytics(start, end),
      this.getInvestmentTrends(start, end),
      this.getCategoryDistribution(),
      this.getTopReferrers(),
      this.getRevenueAnalytics(start, end)
    ]);

    return {
      userGrowth,
      investmentTrends,
      categoryDistribution,
      topReferrers,
      revenueAnalytics,
      period: { start, end }
    };
  }

  async createAnalyticsEvent(event: { 
    userId?: number; 
    eventType: string; 
    eventData?: any; 
    ipAddress?: string; 
    userAgent?: string 
  }): Promise<void> {
    await db.insert(analyticsEvents).values({
      userId: event.userId || null,
      eventType: event.eventType,
      eventData: event.eventData || null,
      ipAddress: event.ipAddress || null,
      userAgent: event.userAgent || null,
    });
  }

  // Helper methods for analytics
  private async getUserGrowthAnalytics(start: Date, end: Date) {
    const daily = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(and(gte(users.createdAt, start), lte(users.createdAt, end)))
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

    return daily;
  }

  private async getInvestmentTrends(start: Date, end: Date) {
    const trends = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        totalAmount: sql<number>`sum(CAST(amount AS DECIMAL))`,
        count: sql<number>`count(*)`
      })
      .from(investmentPackages)
      .where(and(gte(investmentPackages.createdAt, start), lte(investmentPackages.createdAt, end)))
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

    return trends;
  }

  private async getCategoryDistribution() {
    const distribution = await db
      .select({
        category: users.category,
        count: sql<number>`count(*)`
      })
      .from(users)
      .groupBy(users.category);

    return distribution;
  }

  private async getTopReferrers() {
    const topReferrers = await db
      .select({
        referrerId: referrals.referrerId,
        referrerName: users.fullName,
        referrerCategory: users.category,
        totalReferrals: sql<number>`count(*)`,
        totalCommissions: sql<number>`sum(CAST(commission_earned AS DECIMAL))`
      })
      .from(referrals)
      .innerJoin(users, eq(referrals.referrerId, users.id))
      .groupBy(referrals.referrerId, users.fullName, users.category)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return topReferrers;
  }

  private async getRevenueAnalytics(start: Date, end: Date) {
    const revenue = await db
      .select({
        totalInvested: sql<number>`sum(CASE WHEN type = 'deposit' THEN CAST(amount AS DECIMAL) ELSE 0 END)`,
        totalCommissions: sql<number>`sum(CASE WHEN type = 'commission' THEN CAST(amount AS DECIMAL) ELSE 0 END)`,
        totalWithdrawals: sql<number>`sum(CASE WHEN type = 'withdrawal' THEN CAST(amount AS DECIMAL) ELSE 0 END)`
      })
      .from(transactions)
      .where(and(gte(transactions.createdAt, start), lte(transactions.createdAt, end)));

    return revenue[0] || { totalInvested: 0, totalCommissions: 0, totalWithdrawals: 0 };
  }

  private async getTotalDownlineCount(userId: number): Promise<number> {
    const user = await this.getUserById(userId);
    if (!user) return 0;

    const directReferrals = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referredBy, user.referralCode || ''));

    let total = directReferrals.length;
    for (const ref of directReferrals) {
      total += await this.getTotalDownlineCount(ref.id);
    }

    return total;
  }

  private getCategoryLevel(category: string): number {
    const levels = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5, elite: 6 };
    return levels[category as keyof typeof levels] || 0;
  }

  private generateReferralCode(fullName: string): string {
    const initials = fullName.split(' ').map(name => name.charAt(0)).join('').toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `PSS-${initials}${timestamp}`;
  }
}

export const storage = new DatabaseStorage();
