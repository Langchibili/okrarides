'use strict';

import { factories } from '@strapi/strapi';
import { nanoid }    from 'nanoid';

interface QueryParams {
  sort?: string;
  filters?: {
    ticketStatus?: { $eq?: string };
    category?:     { $eq?: string };
    createdAt?:    { $gte?: string; $lte?: string };
  };
  pagination?: { page?: number; pageSize?: number };
}

const parseSortParam = (sort?: string) => {
  if (!sort) return { createdAt: 'desc' };
  const [field, dir] = sort.split(':');
  return { [field]: (dir?.toLowerCase() === 'asc' ? 'asc' : 'desc') };
};

// ── Shared populate shape ─────────────────────────────────────────────────────
const TICKET_POPULATE = {
  user: {
    fields: ['id', 'firstName', 'lastName', 'phoneNumber', 'username'],
  },
  assignedTo: {
    fields: ['id', 'firstName', 'lastName', 'username'],
  },
  attachments: true,
  responses:   true,
  ride: {
    fields: ['id', 'rideStatus', 'totalFare'],
  },
};

export default factories.createCoreController(
  'api::support-ticket.support-ticket',
  ({ strapi }) => ({

    // ── find ────────────────────────────────────────────────────────────────
    async find(ctx) {
      try {
        const query = ctx.query as QueryParams;
        const userId = ctx.state?.user?.id;

        const where: Record<string, any> = {
          // Drivers / admins can see all; regular users only see their own
          ...(userId ? { user: { id: userId } } : {}),
        };

        if (query.filters?.ticketStatus?.$eq) {
          where.ticketStatus = query.filters.ticketStatus.$eq;
        }
        if (query.filters?.category?.$eq) {
          where.category = query.filters.category.$eq;
        }
        if (query.filters?.createdAt?.$gte) {
          where.createdAt = {
            $gte: query.filters.createdAt.$gte,
            ...(query.filters.createdAt.$lte && { $lte: query.filters.createdAt.$lte }),
          };
        }

        const pageSize = query.pagination?.pageSize || 20;
        const page     = query.pagination?.page     || 1;
        const orderBy  = parseSortParam(query.sort);

        const [entities, total] = await Promise.all([
          strapi.db.query('api::support-ticket.support-ticket').findMany({
            where,
            populate: TICKET_POPULATE,
            orderBy,
            limit:  pageSize,
            offset: (page - 1) * pageSize,
          }),
          strapi.db.query('api::support-ticket.support-ticket').count({ where }),
        ]);

        const sanitized = await Promise.all(
          entities.map(e => this.sanitizeOutput(e, ctx))
        );

        return {
          data: sanitized,
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
        strapi.log.error('Find support tickets error:', error);
        return ctx.internalServerError('Failed to fetch support tickets');
      }
    },

    // ── findOne ─────────────────────────────────────────────────────────────
    async findOne(ctx) {
      const { id } = ctx.params;
      try {
        const entity = await strapi.db.query('api::support-ticket.support-ticket').findOne({
          where:    { id },
          populate: TICKET_POPULATE,
        });

        if (!entity) return ctx.notFound('Support ticket not found');

        const userId  = ctx.state?.user?.id;
        const isOwner = entity.user?.id === userId;

        if (!isOwner) return ctx.forbidden('You do not have access to this ticket');

        const sanitized = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitized);
      } catch (error) {
        strapi.log.error('FindOne support ticket error:', error);
        return ctx.internalServerError('Failed to fetch support ticket');
      }
    },

    // ── create (standard — for authenticated users) ──────────────────────────
    async create(ctx) {
      try {
        const { data } = ctx.request.body as { data: Record<string, any> };
        const userId   = ctx.state?.user?.id || 1;

        const ticketId = `TKT-${nanoid(8).toUpperCase()}`;

        const entity = await strapi.db.query('api::support-ticket.support-ticket').create({
          data: {
            ...data,
            ticketId,
            user:        { id: userId },
            ticketStatus: 'open',
            priority:    data.priority || 'medium',
          },
          populate: TICKET_POPULATE,
        });

        const sanitized = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitized);
      } catch (error) {
        strapi.log.error('Create support ticket error:', error);
        return ctx.internalServerError('Failed to create support ticket');
      }
    },

    // ── update ──────────────────────────────────────────────────────────────
    async update(ctx) {
      const { id } = ctx.params;
      try {
        const { data } = ctx.request.body as { data: Record<string, any> };
        const userId   = ctx.state?.user?.id;

        const existing = await strapi.db.query('api::support-ticket.support-ticket').findOne({
          where: { id },
        });

        if (!existing) return ctx.notFound('Support ticket not found');
        if (existing.user?.id !== userId) return ctx.forbidden('You cannot update this ticket');

        // Prevent re-opening a closed/resolved ticket
        if (['resolved', 'closed'].includes(existing.ticketStatus)) {
          return ctx.badRequest('Cannot update a resolved or closed ticket');
        }

        const entity = await strapi.db.query('api::support-ticket.support-ticket').update({
          where:    { id },
          data,
          populate: TICKET_POPULATE,
        });

        const sanitized = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitized);
      } catch (error) {
        strapi.log.error('Update support ticket error:', error);
        return ctx.internalServerError('Failed to update support ticket');
      }
    },

    // ── delete ──────────────────────────────────────────────────────────────
    async delete(ctx) {
      const { id } = ctx.params;
      try {
        const userId   = ctx.state?.user?.id;

        const existing = await strapi.db.query('api::support-ticket.support-ticket').findOne({
          where: { id },
        });

        if (!existing) return ctx.notFound('Support ticket not found');
        if (existing.user?.id !== userId) return ctx.forbidden('You cannot delete this ticket');

        // Only allow deleting open/draft tickets
        if (!['open'].includes(existing.ticketStatus)) {
          return ctx.badRequest('Only open (draft) tickets can be deleted');
        }

        const entity = await strapi.db.query('api::support-ticket.support-ticket').delete({
          where: { id },
        });

        const sanitized = await this.sanitizeOutput(entity, ctx);
        return this.transformResponse(sanitized);
      } catch (error) {
        strapi.log.error('Delete support ticket error:', error);
        return ctx.internalServerError('Failed to delete support ticket');
      }
    },

    // ── createDraft (custom — guest + auth) ──────────────────────────────────
    async createDraft(ctx) {
      try {
        const { category, subject, description, phoneNumber, guestName } =
          ctx.request.body as Record<string, string>;

        if (!category || !subject || !description) {
          return ctx.badRequest('category, subject and description are required');
        }

        const userId = ctx.state?.user?.id || 1;

        // Anti-spam: max 5 open drafts per user
        const existingCount = await strapi.db
          .query('api::support-ticket.support-ticket')
          .count({
            where: { user: { id: userId }, ticketStatus: 'open' },
          });

        if (existingCount >= 5) {
          return ctx.badRequest(
            'Too many open tickets. Please submit or cancel existing ones first.'
          );
        }

        const ticketId = `TKT-${nanoid(8).toUpperCase()}`;

        const ticket = await strapi.db.query('api::support-ticket.support-ticket').create({
          data: {
            ticketId,
            user:        { id: userId },
            category,
            subject,
            description,
            ticketStatus: 'open',
            priority:    'medium',
            phoneNumber: phoneNumber || null,
            tags:        guestName ? { guestName } : null,
          },
        });

        ctx.send({ id: ticket.id, ticketId: ticket.ticketId });
      } catch (error) {
        strapi.log.error('CreateDraft error:', error);
        return ctx.internalServerError('Failed to create draft ticket');
      }
    },

    // ── submitTicket (open → in_progress) ────────────────────────────────────
    async submitTicket(ctx) {
      try {
        const { id }                     = ctx.params;
        const { guestName, phoneNumber } = (ctx.request.body ?? {}) as Record<string, string>;

        const ticket = await strapi.db.query('api::support-ticket.support-ticket').findOne({
          where:    { id },
          populate: { user: true, attachments: true },
        });

        if (!ticket) return ctx.notFound('Ticket not found');

        if (!['open', 'waiting_for_user'].includes(ticket.ticketStatus)) {
          return ctx.badRequest('Ticket has already been submitted or closed.');
        }

        if ((ticket.attachments?.length ?? 0) > 5) {
          return ctx.badRequest('Maximum 5 screenshots per ticket.');
        }

        const updateData: Record<string, any> = { ticketStatus: 'in_progress' };

        if (guestName)   updateData.tags        = { ...(ticket.tags || {}), guestName };
        if (phoneNumber) updateData.phoneNumber = phoneNumber;

        const updated = await strapi.db.query('api::support-ticket.support-ticket').update({
          where:    { id },
          data:     updateData,
          populate: { user: true, attachments: true },
        });

        ctx.send({
          id:           updated.id,
          ticketId:     updated.ticketId,
          ticketStatus: updated.ticketStatus,
        });
      } catch (error) {
        strapi.log.error('SubmitTicket error:', error);
        return ctx.internalServerError('Failed to submit ticket');
      }
    },

    // ── getMyTickets ──────────────────────────────────────────────────────────
    async getMyTickets(ctx) {
      try {
        const userId = ctx.state?.user?.id;
        if (!userId) return ctx.unauthorized();

        const tickets = await strapi.db.query('api::support-ticket.support-ticket').findMany({
          where:    { user: { id: userId } },
          populate: TICKET_POPULATE,
          orderBy:  { createdAt: 'desc' },
          limit:    20,
          offset:   0,
        });

        const sanitized = await Promise.all(
          tickets.map(t => this.sanitizeOutput(t, ctx))
        );

        ctx.send({ data: sanitized });
      } catch (error) {
        strapi.log.error('GetMyTickets error:', error);
        return ctx.internalServerError('Failed to fetch tickets');
      }
    },
  })
);