import { Context } from 'telegraf';
import { config } from '../../config';

interface PendingPayment {
    userId: number;
    amount: number;
    status: 'pending' | 'confirmed' | 'rejected';
    createdAt: Date;
    username?: string;
}

const pendingPayments = new Map<number, PendingPayment>();

export const PAYMENT_AMOUNT = 10000; // 10,000 som

export function createPendingPayment(userId: number, username?: string): PendingPayment {
    const payment: PendingPayment = {
        userId,
        amount: PAYMENT_AMOUNT,
        status: 'pending',
        createdAt: new Date(),
        username,
    };
    pendingPayments.set(userId, payment);
    return payment;
}

export function getPendingPayment(userId: number): PendingPayment | undefined {
    return pendingPayments.get(userId);
}

export function confirmPayment(userId: number): boolean {
    const payment = pendingPayments.get(userId);
    if (!payment) return false;
    payment.status = 'confirmed';
    return true;
}

export function rejectPayment(userId: number): boolean {
    const payment = pendingPayments.get(userId);
    if (!payment) return false;
    payment.status = 'rejected';
    return true;
}

export function removePendingPayment(userId: number): void {
    pendingPayments.delete(userId);
}

export function getAllPendingPayments(): PendingPayment[] {
    return Array.from(pendingPayments.values()).filter(p => p.status === 'pending');
}
