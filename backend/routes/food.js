const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

module.exports = (requireAuth) => {
    // GET all available food waste data
    router.get('/', requireAuth, async (req, res) => {
        const { data, error } = await supabase
            .from('food_waste_data')
            .select(`
                id, food_category, amount_wasted, cause_of_waste, location, disposal_method, date_of_waste, available, created_at,
                users ( id, first_name, last_name, email, phone )
            `)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    });

    // POST a new food waste entry
    router.post('/', requireAuth, async (req, res) => {
        const { food_category, amount_wasted, cause_of_waste, location, disposal_method, date_of_waste, available } = req.body;
        
        const { data, error } = await supabase
            .from('food_waste_data')
            .insert([{ 
                food_category, 
                amount_wasted, 
                cause_of_waste, 
                location, 
                disposal_method, 
                date_of_waste, 
                available,
                user_id: req.user.id // Extracted securely from JWT
            }])
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    });

    // POST request food
    router.post('/:id/request', requireAuth, async (req, res) => {
        const { id } = req.params; // food_waste_id
        
        const { data, error } = await supabase
            .from('food_requests')
            .insert([{
                food_id: id,       // matches migration schema column name
                user_id: req.user.id
            }])
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    });

    return router;
};
