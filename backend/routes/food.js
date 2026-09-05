const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

module.exports = (requireAuth) => {
    // GET all available food waste data with owner and request details
    router.get('/', requireAuth, async (req, res) => {
        const { data, error } = await supabase
            .from('food_waste_data')
            .select(`
                id, food_category, amount_wasted, cause_of_waste, location, disposal_method, date_of_waste, available, user_id, created_at,
                users ( id, first_name, last_name, email, phone ),
                food_requests ( id, user_id, request_date, users ( id, first_name, last_name, email, phone ) )
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
                available: available !== undefined ? available : true,
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

        // 1. Fetch the food item
        const { data: foodItem, error: foodErr } = await supabase
            .from('food_waste_data')
            .select('id, user_id, available')
            .eq('id', id)
            .single();

        if (foodErr || !foodItem) {
            return res.status(404).json({ error: 'Food item not found' });
        }

        // 2. Prevent user from requesting their own food
        if (foodItem.user_id === req.user.id) {
            return res.status(400).json({ error: 'You cannot request your own food listing.' });
        }

        // 3. Ensure item is still available
        if (!foodItem.available) {
            return res.status(400).json({ error: 'This food item is no longer available.' });
        }

        // 4. Check if user already requested this item
        const { data: existingReq } = await supabase
            .from('food_requests')
            .select('id')
            .eq('food_id', id)
            .eq('user_id', req.user.id)
            .maybeSingle();

        if (existingReq) {
            return res.status(400).json({ error: 'You have already submitted a request for this item.' });
        }

        // 5. Insert the request
        const { data, error } = await supabase
            .from('food_requests')
            .insert([{
                food_id: id,
                user_id: req.user.id
            }])
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    });

    // PATCH mark food item as delivered
    router.patch('/:id/deliver', requireAuth, async (req, res) => {
        const { id } = req.params;

        // 1. Fetch the food item
        const { data: foodItem, error: foodErr } = await supabase
            .from('food_waste_data')
            .select('id, user_id, available')
            .eq('id', id)
            .single();

        if (foodErr || !foodItem) {
            return res.status(404).json({ error: 'Food item not found' });
        }

        // 2. Check if user is an admin
        const { data: userData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', req.user.id)
            .single();
        const isAdmin = userData?.is_admin === true;

        // 3. Only owner or admin can mark as delivered
        if (foodItem.user_id !== req.user.id && !isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Only the owner or an administrator can mark this item as delivered' });
        }

        // 4. Mark item as fulfilled (available = false)
        const { data, error } = await supabase
            .from('food_waste_data')
            .update({ available: false })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Item marked as delivered', data });
    });

    return router;
};
