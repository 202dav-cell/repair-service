/* DAV Service — application state and DOM references */
let allRepairs = [];
let currentTab = 'NEW';

const loginScreen = document.getElementById('loginScreen');
const app = document.getElementById('app');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const newRepairModal = document.getElementById('newRepairModal');
const newRepairForm = document.getElementById('newRepairForm');
const formMessage = document.getElementById('formMessage');
