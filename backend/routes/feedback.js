const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

module.exports = (requireAuth) => {
    // GET all feedback
    router.get('/', requireAuth, async (req, res) => {
        const { data, error } = await supabase
            .from('feedback')
            .select(`
                id, rating, comments, created_at,
                users ( first_name, last_name ),
                reduction_programs ( program_name )
            `)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    });

    // POST new feedback
    router.post('/', requireAuth, async (req, res) => {
        const { rating, comments, program_id } = req.body;
        
        const insertData = {
            user_id: req.user.id,
            rating,
            comments
        };

        if (program_id) {
            insertData.program_id = program_id;
        }

        const { data, error } = await supabase
            .from('feedback')
            .insert([insertData])
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    });

    return router;
};
