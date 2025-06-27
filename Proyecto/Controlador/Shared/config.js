const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const SETTINGS = {
  LINK_BACK: process.env.LINK_SUPABASE,
  ANON: process.env.ANON_SUPASE
};

module.exports = SETTINGS;