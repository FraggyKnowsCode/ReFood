const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

module.exports = (requireAuth, requireAdmin) => {
    // GET all cost entries
    router.get('/', requireAuth, requireAdmin, async (req, res) => {
        const { data, error } = await supabase
            .from('cost_management')
            .select(`
                *,
                reduction_programs ( program_name )
            `)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    });

    // POST a new cost entry
    router.post('/', requireAuth, requireAdmin, async (req, res) => {
        const { program_id, labour_cost, maintenance_cost, transportation_cost, event_cost, other_cost } = req.body;
        
        // Calculate total cost mathematically on the server
        const total_cost = Number(labour_cost) + Number(maintenance_cost) + Number(transportation_cost) + Number(event_cost) + Number(other_cost);

        const { data, error } = await supabase
            .from('cost_management')
            .insert([{ 
                program_id, 
                labour_cost, 
                maintenance_cost, 
                transportation_cost, 
                event_cost, 
                other_cost,
                total_cost
            }])
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    });

    return router;
};
