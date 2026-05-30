export default {
    routes: [
        {
            method: 'GET',
            path: '/ledger-entries/partner-floats/:userId',
            handler: 'ledger-entry.getPartnerFloats',
            config: {
                auth: false, // set true if authentication required
            },
        },
    ],
};