'use strict';
const cls = require('cls-hooked');
const NAMESPACE = 'echotune_request_context';
let ns = cls.getNamespace(NAMESPACE);
if (!ns) ns = cls.createNamespace(NAMESPACE);
function runWithContext(correlationId, fn) { ns.run(() => { ns.set('correlationId', correlationId); fn(); }); }
function getCorrelationId() { return ns.get('correlationId'); }
function set(key, value) { ns.set(key, value); }
function get(key) { return ns.get(key); }
module.exports = { runWithContext, getCorrelationId, set, get, namespace: ns };