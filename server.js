const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration Supabase
const SUPABASE_URL = 'https://qrtgxvuzdbgzpiauqjap.supabase.co';
const SUPABASE_KEY = 'sb_publishable_siGDG6t4Hz45g3bEPHL4qw_SSdqGcMx';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MAKETOU_API_KEY = 'VOTRE_CLE_MAKETOU';

// 1. Envoyer un message anonyme
app.post('/api/send-message', async (req, res) => {
    const { username, content, sender_hint } = req.body;

    if (!content || !username) {
        return res.status(400).json({ error: 'Message et nom requis.' });
    }

    const { data: user, error: userErr } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

    if (userErr || !user) {
        return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const { data, error } = await supabase
        .from('messages')
        .insert([{
            user_id: user.id,
            content: content,
            sender_hint: sender_hint || 'Indice masqué',
            hint_unlocked: false
        }]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, message: 'Message anonyme envoyé !' });
});

// 2. Récupérer les messages
app.get('/api/messages/:username', async (req, res) => {
    const { username } = req.params;

    const { data: user, error: userErr } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

    if (userErr || !user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const { data: messages, error } = await supabase
        .from('messages')
        .select('id, content, sender_hint, hint_unlocked, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const formattedMessages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        hint_unlocked: msg.hint_unlocked,
        sender_hint: msg.hint_unlocked ? msg.sender_hint : '🔒 Payez 500 FCFA via Maketou pour débloquer'
    }));

    res.json({ success: true, messages: formattedMessages });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur prêt sur http://localhost:${PORT}`);
});
