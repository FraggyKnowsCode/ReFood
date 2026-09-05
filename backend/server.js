const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabase = require('./supabaseClient');

const app = express();
app.use(cors());
app.use(express.json());

// Auth Middleware to validate Supabase JWT
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    // Validate JWT token with Supabase GoTrue
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.user = user;
    next();
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
    // In a fully normalized Supabase setup, you might use JWT custom claims for roles.
    // Alternatively, we query our newly normalized `users` table for `is_admin`.
    const { data: userData, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', req.user.id)
        .single();
        
    if (error || !userData?.is_admin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    
    next();
};

// Example Protected Admin Route
app.get('/api/admin/dashboard', requireAuth, requireAdmin, (req, res) => {
    res.json({ 
        message: 'Welcome to the Secure Admin Dashboard', 
        user: req.user 
    });
});

// Dashboard Stats Endpoint
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
        // Aggregate total donations
        const { data: donationsData, error: donationsError } = await supabase
            .from('donations')
            .select('amount');
        if (donationsError) throw donationsError;
        const totalDonations = donationsData.reduce((sum, item) => sum + Number(item.amount), 0);

        // Aggregate total active programs
        const { count: programsCount, error: programsError } = await supabase
            .from('reduction_programs')
            .select('*', { count: 'exact', head: true });
        if (programsError) throw programsError;

        // Aggregate total food waste entries
        const { count: wasteCount, error: wasteError } = await supabase
            .from('food_waste_data')
            .select('*', { count: 'exact', head: true });
        if (wasteError) throw wasteError;

        res.json({
            totalDonations,
            totalPrograms: programsCount,
            totalWasteEntries: wasteCount
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Public Registration Endpoint (uses Admin API to bypass email confirmation)
app.post('/api/auth/register', async (req, res) => {
    const { email, password, first_name, last_name, phone } = req.body;
    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Step 1: Create user in Supabase Auth (auto-confirmed, no email sent)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // auto-confirm, no verification email
        });
        if (authError) throw authError;

        const userId = authData.user.id;

        // Step 2: Sync profile into the public `users` table
        const { error: profileError } = await supabase
            .from('users')
            .insert([{ id: userId, email, first_name, last_name, phone: phone || null, is_admin: false }]);
        if (profileError) throw profileError;

        res.status(201).json({ message: 'Account created successfully' });
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// Register Routes
const programsRoute = require('./routes/programs');
const foodRoute = require('./routes/food');
const donationsRoute = require('./routes/donations');
const costsRoute = require('./routes/costs');
const usersRoute = require('./routes/users');
const feedbackRoute = require('./routes/feedback');
app.use('/api/programs', programsRoute(requireAuth, requireAdmin));
app.use('/api/food', foodRoute(requireAuth));
app.use('/api/donations', donationsRoute(requireAuth));
app.use('/api/costs', costsRoute(requireAuth, requireAdmin));
app.use('/api/users', usersRoute(requireAuth, requireAdmin));
app.use('/api/feedback', feedbackRoute(requireAuth));

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
