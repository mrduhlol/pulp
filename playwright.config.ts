import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/ui',workers:1,use:{browserName:'chromium',headless:true,launchOptions:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']},viewport:{width:520,height:600}},reporter:'line'});
