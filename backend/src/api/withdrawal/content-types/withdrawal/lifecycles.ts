// src/api/withdrawal/content-types/withdrawal/lifecycles.ts

import socketService from '../../../../services/socketService';

export default {
  async afterUpdate(event: any) {
    const { result, params } = event;

    // In Strapi v5 lifecycles, params.data contains the attributes sent in the update
    const newStatus = result.withdrawalStatus;
    const updateData = params?.data;

    // Check if status is being updated to 'completed'
    // Note: logic checks if the incoming data or the result reflects the status change
    if (newStatus === 'completed' && updateData?.withdrawalStatus === 'completed') {
      
      // Populate relations to get driver information
      const withdrawal: any = await strapi.db.query('api::withdrawal.withdrawal').findOne({
        where: { id: result.id },
        populate: ['driver'],
      });

      if (withdrawal && withdrawal.driver) {
        // Emit withdrawal processed event using the socket service
        socketService.emitWithdrawalProcessed(
          withdrawal.driver.id,
          withdrawal.amount,
          withdrawal.paymentMethod || 'bank_transfer',
          withdrawal.transactionId || withdrawal.id
        );
      }
    }
  },
};

/**
 * old schema
  {
  "kind": "collectionType",
  "collectionName": "withdrawals",
  "info": {
    "singularName": "withdrawal",
    "pluralName": "withdrawals",
    "displayName": "Withdrawal",
    "name": "withdrawal"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {
    "content-manager": {
      "visible": true
    },
    "content-type-builder": {
      "visible": true
    }
  },
  "attributes": {
    "withdrawalId": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "user": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "amount": {
      "type": "decimal",
      "required": true
    },
    "currency": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::currency.currency"
    },
    "method": {
      "type": "enumeration",
      "required": true,
      "enum": [
        "okrapay",
        "mobile_money",
        "bank_transfer"
      ]
    },
    "accountDetails": {
      "type": "json",
      "required": true
    },
    "withdrawalStatus": {
      "type": "enumeration",
      "default": "pending",
      "enum": [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled"
      ]
    },
    "requestedAt": {
      "type": "datetime",
      "required": true
    },
    "processedAt": {
      "type": "datetime"
    },
    "processedBy": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "gatewayReference": {
      "type": "string"
    },
    "gatewayResponse": {
      "type": "json"
    },
    "notes": {
      "type": "text"
    },
    "failureReason": {
      "type": "text"
    }
  }
}



 * 
 */