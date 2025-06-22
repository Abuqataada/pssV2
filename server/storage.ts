import {
  users,
  investmentPackages,
  referrals,
  withdrawalRequests,
  transactions,
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
import { eq, and, desc, sum, sql } from "drizzle-orm";
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

  private generateReferralCode(fullName: string): string {
    const initials = fullName.split(' ').map(name => name.charAt(0)).join('').toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `PSS-${initials}${timestamp}`;
  }
}

export const storage = new DatabaseStorage();
