import { factories } from '@strapi/strapi';

export default factories.createCoreController(
    'api::ledger-entry.ledger-entry',
    ({ strapi }) => ({
        async find(ctx) {
            return await super.find(ctx);
        },

        async findOne(ctx) {
            return await super.findOne(ctx);
        },

        async create(ctx) {
            return await super.create(ctx);
        },

        async update(ctx) {
            return await super.update(ctx);
        },

        async delete(ctx) {
            return await super.delete(ctx);
        },

        /**
         * Get partner float ledger entries
         * GET /ledger-entries/partner-floats/:userId
         */
        async getPartnerFloats(ctx) {
            try {
                const { userId } = ctx.params;

                const page = Number(ctx.query.page || 1);
                const pageSize = Number(ctx.query.pageSize || 15);

                const offset = (page - 1) * pageSize;

                const where = {
                    driver: {
                        id: Number(userId),
                    },
                    type: {
                        $in: [
                            'float_topup-partner',
                            'float_debit-partner',
                            'float_deduction',
                            'float_topup'
                        ],
                    },
                };

                const [entries, total] = await Promise.all([
                    strapi.db.query('api::ledger-entry.ledger-entry').findMany({
                        where,
                        populate: {
                            driver: true,
                            ride: true,
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                        offset,
                        limit: pageSize,
                    }),

                    strapi.db.query('api::ledger-entry.ledger-entry').count({
                        where,
                    }),
                ]);
                const response = await Promise.all([
                    strapi.db.query('api::ledger-entry.ledger-entry').findMany({
                        where: {
                            driver: {
                                id: Number(userId)
                            }
                        },
                        populate: {
                            driver: true,
                            ride: true,
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                        offset,
                        limit: pageSize,
                    }),

                    strapi.db.query('api::ledger-entry.ledger-entry').count({
                        where,
                    }),
                ]);

                const sanitizedEntries = await this.sanitizeOutput(
                    entries,
                    ctx
                );

                return {
                    data: sanitizedEntries,
                    meta: {
                        pagination: {
                            page,
                            pageSize,
                            pageCount: Math.ceil(total / pageSize),
                            total,
                        },
                    },
                };
            } catch (error) {
                strapi.log.error('Partner float lookup error:', error);
                return ctx.internalServerError(
                    'Failed to fetch partner float transactions'
                );
            }
        },
    })
);