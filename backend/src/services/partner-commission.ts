import { resolveSettingsForUser } from './settingsResolver';

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function getPartnerCommissionBalance(strapi: any, partnerUserId: number) {
  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: partnerUserId },
    select: ['id'],
    populate: {
      partnerProfile: { select: ['id'] },
      country: { select: ['id', 'name', 'code'], populate: { currency: { select: ['id', 'code', 'symbol'] } } },
    },
  });
  if (!user?.partnerProfile) throw new Error('Partner profile not found');

  const [rides, deliveries, payments, settings] = await Promise.all([
    strapi.db.query('api::ride.ride').findMany({
      where: { driver: { partner: { id: partnerUserId } }, rideStatus: 'completed' },
      select: ['commission'],
    }),
    strapi.db.query('api::delivery.delivery').findMany({
      where: { deliverer: { partner: { id: partnerUserId } }, rideStatus: 'completed' },
      select: ['commission'],
    }),
    strapi.db.query('api::transaction.transaction').findMany({
      where: {
        user: { id: partnerUserId },
        type: 'partner_commission_payment',
        transactionStatus: 'completed',
      },
      select: ['amount'],
    }),
    resolveSettingsForUser(strapi, partnerUserId),
  ]);

  const commissionEarned = [...rides, ...deliveries].reduce(
    (sum: number, item: any) => sum + (Number(item.commission) || 0),
    0,
  );
  const partnerCommisionPercentage = Math.max(
    0,
    Math.min(100, Number(settings.partnerCommisionPercentage) || 0),
  );
  const partnerShareEarned = roundMoney(commissionEarned * partnerCommisionPercentage / 100);
  const commissionPayable = roundMoney(commissionEarned - partnerShareEarned);
  const amountPaid = roundMoney(payments.reduce(
    (sum: number, item: any) => sum + (Number(item.amount) || 0),
    0,
  ));

  return {
    partnerUserId,
    country: user.country ?? null,
    currency: user.country?.currency ?? null,
    commissionEarned: roundMoney(commissionEarned),
    partnerCommisionPercentage,
    partnerShareEarned,
    commissionPayable,
    amountPaid,
    amountOwedToOkra: roundMoney(Math.max(0, commissionPayable - amountPaid)),
  };
}

export async function recordPartnerCommissionPayment(
  strapi: any,
  okrapayRecord: any,
  webhookData: Record<string, unknown>,
): Promise<void> {
  const partnerUserId = Number(okrapayRecord.user?.id ?? okrapayRecord.user);
  const balance = await getPartnerCommissionBalance(strapi, partnerUserId);
  const paymentAmount = roundMoney(Number(okrapayRecord.amount));
  if (paymentAmount <= 0) throw new Error('Partner commission payment amount is invalid');

  const transactionId = `TXN-PC-${okrapayRecord.id}`;
  const existing = await strapi.db.query('api::transaction.transaction').findOne({
    where: { transactionId },
    select: ['id'],
  });
  if (existing) return;

  await strapi.db.query('api::transaction.transaction').create({
    data: {
      transactionId,
      user: partnerUserId,
      type: 'partner_commission_payment',
      amount: paymentAmount,
      transactionStatus: 'completed',
      paymentMethod: 'okrapay',
      gatewayReference: okrapayRecord.gatewayReference,
      gatewayResponse: webhookData,
      processedAt: new Date(),
      metadata: {
        okrapayId: okrapayRecord.id,
        commissionEarnedAtPayment: balance.commissionEarned,
      },
    },
  });
}
