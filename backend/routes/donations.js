const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

module.exports = (requireAuth) => {
    // GET all donations + aggregate stats
    router.get('/', requireAuth, async (req, res) => {
        try {
            const { data: donations, error } = await supabase
                .from('donations')
                .select('*')
                .order('donation_date', { ascending: false });

            if (error) throw error;

            const verified = donations.filter(d => d.status === 'verified');
            const total = verified.reduce((sum, d) => sum + Number(d.amount), 0);

            const methods = donations.reduce((acc, curr) => {
                acc[curr.payment_method] = (acc[curr.payment_method] || 0) + Number(curr.amount);
                return acc;
            }, {});

            res.json({
                donations,
                summary: {
                    total,
                    byMethod: Object.keys(methods).map(method => ({
                        payment_method: method,
                        method_total: methods[method]
                    }))
                }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST a new donation (public — no auth required to donate)
    router.post('/', async (req, res) => {
        const {
            donor_name, donor_email, amount, payment_method,
            transaction_id, mobile_provider, bank_name, account_last4
        } = req.body;

        const { data, error } = await supabase
            .from('donations')
            .insert([{
                donor_name,
                donor_email,
                amount,
                payment_method,
                transaction_id: transaction_id || null,
                mobile_provider: mobile_provider || null,
                bank_name: bank_name || null,
                account_last4: account_last4 || null,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    });

    // PATCH verify a donation (Admin only)
    router.patch('/:id/verify', requireAuth, async (req, res) => {
        const { id } = req.params;

        // Check admin
        const { data: userData } = await supabase
            .from('users').select('is_admin').eq('id', req.user.id).single();
        if (!userData?.is_admin) return res.status(403).json({ error: 'Admin only' });

        const { data, error } = await supabase
            .from('donations')
            .update({ status: 'verified' })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    });

    // PATCH reject a donation (Admin only)
    router.patch('/:id/reject', requireAuth, async (req, res) => {
        const { id } = req.params;

        const { data: userData } = await supabase
            .from('users').select('is_admin').eq('id', req.user.id).single();
        if (!userData?.is_admin) return res.status(403).json({ error: 'Admin only' });

        const { data, error } = await supabase
            .from('donations')
            .update({ status: 'rejected' })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    });

    return router;
};
