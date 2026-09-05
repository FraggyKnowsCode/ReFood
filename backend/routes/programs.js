const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

module.exports = (requireAuth, requireAdmin) => {
    // GET all events
    router.get('/', requireAuth, async (req, res) => {
        const { data, error } = await supabase
            .from('reduction_programs')
            .select('*, users(first_name, last_name)')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    });

    // GET a single event with feedback
    router.get('/:id', requireAuth, async (req, res) => {
        const { id } = req.params;

        const { data: program, error: programError } = await supabase
            .from('reduction_programs')
            .select('*, users(first_name, last_name)')
            .eq('id', id)
            .single();

        if (programError || !program) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const { data: feedback, error: feedbackError } = await supabase
            .from('feedback')
            .select(`id, rating, comments, created_at, users ( id, first_name, last_name, email )`)
            .eq('program_id', id)
            .order('created_at', { ascending: false });

        if (feedbackError) return res.status(500).json({ error: feedbackError.message });

        const avgRating = feedback.length > 0
            ? feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length
            : 0;

        res.json({ ...program, feedback, average_rating: avgRating });
    });

    // POST a new event (any authenticated user can create)
    router.post('/', requireAuth, async (req, res) => {
        const { program_name, start_date, end_date, participating_organizations } = req.body;

        const { data, error } = await supabase
            .from('reduction_programs')
            .insert([{
                program_name,
                start_date,
                end_date,
                participating_organizations,
                created_by: req.user.id   // track who created it
            }])
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data);
    });

    // PUT update event — Admin OR the original creator
    router.put('/:id', requireAuth, async (req, res) => {
        const { id } = req.params;
        const { program_name, start_date, end_date, participating_organizations } = req.body;

        // Fetch the event to check ownership
        const { data: existing, error: fetchError } = await supabase
            .from('reduction_programs')
            .select('created_by')
            .eq('id', id)
            .single();

        if (fetchError || !existing) return res.status(404).json({ error: 'Event not found' });

        // Check if user is admin
        const { data: userData } = await supabase
            .from('users').select('is_admin').eq('id', req.user.id).single();

        const isAdmin = userData?.is_admin === true;
        const isOwner = existing.created_by === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Forbidden: Only the creator or an admin can edit this event.' });
        }

        const { data, error } = await supabase
            .from('reduction_programs')
            .update({ program_name, start_date, end_date, participating_organizations })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    });

    // DELETE event — Admin OR the original creator
    router.delete('/:id', requireAuth, async (req, res) => {
        const { id } = req.params;

        const { data: existing, error: fetchError } = await supabase
            .from('reduction_programs')
            .select('created_by')
            .eq('id', id)
            .single();

        if (fetchError || !existing) return res.status(404).json({ error: 'Event not found' });

        const { data: userData } = await supabase
            .from('users').select('is_admin').eq('id', req.user.id).single();

        const isAdmin = userData?.is_admin === true;
        const isOwner = existing.created_by === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Forbidden: Only the creator or an admin can delete this event.' });
        }

        const { error } = await supabase
            .from('reduction_programs')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ error: error.message });
        res.status(204).send();
    });

    return router;
};
