class Edge {
    constructor(to, d) {
        this.to = to;
        this.d = d;
        this.blocked = false;
        this.next = null;
    }
}
class Edgelist {
    constructor() {
        this.head = null;
    }
    insert(to, d) {
        const E = new Edge(to, d);
        E.next = this.head;
        this.head = E;
    }
    find(to) {
        for (let E = this.head; E; E = E.next) {
            if (E.to == to) return E;
        }
        return null;
    }
    remove(to) {
        let prev = null;
        for (let E = this.head; E; E = E.next) {
            if (E.to == to) {
                if (prev == null) this.head = E.next;
                else prev.next = E.next;
                return true;
            }
            prev = E;
        }
        return false;
    }
}
class Qnode {
    constructor(v) {
        this.v = v;
        this.next = null;
    }
}
class Queue {
    constructor() {
        this.f = null;
        this.r = null;
    }
    isEmpty() {
        if (this.f == null) return true;
        return false;
    }
    enqueue(v) {
        const N = new Qnode(v);
        if (this.r == null) this.f = this.r = N;
        else {
            this.r.next = N;
            this.r = N;
        }

    }
    dequeue() {
        if (this.f == null) return null;
        const v = this.f.v;
        this.f = this.f.next;
        if (this.f == null) this.r = null;
        return v;
    }
}
class Stack {
    constructor() {
        this.top = null;
    }
    isEmpty() {
        return this.top == null;
    }
    push(v) {
        const N = new Qnode(v);
        N.next = this.top;
        this.top = N;
    }
    pop() {
        if (this.top == null) return null;
        const v = this.top.v;
        this.top = this.top.next;
        return v;
    }
}
class Campus {
    constructor() {
        this.names = [];
        this.adj = [];
        this.x = [];
        this.y = [];

    }
    index(name) {
        return this.names.indexOf(name);
    }
    addLocation(name, x = 0, y = 0) {
        if (this.index(name) == -1) {
            this.names.push(name);
            this.adj.push(new Edgelist());
            this.x.push(x);
            this.y.push(y);
            return true;
        }
        else return false;
    }
    addpolar(name, ref, angle, dist) {
    const x = this.x[ref] + dist * Math.sin(angle * Math.PI / 180);
    const y = this.y[ref] + dist * Math.cos(angle * Math.PI / 180);
    return this.addLocation(name, x, y);
}
    addpath(a, b, d) {
        this.adj[a].insert(b, d);
        this.adj[b].insert(a, d);
    }
    isTaken(x, y) { 
        return this.x.some((px, i) => Math.hypot(px - x, this.y[i] - y) < 5);
     }

    findpath(a, b) {
        return this.adj[a].find(b) != null;
    }
    setblock(a, b, flag) {
        this.adj[a].find(b).blocked = flag;
        this.adj[b].find(a).blocked = flag;
    }
    removepath(a, b) {

        this.adj[a].remove(b);
        this.adj[b].remove(a);

    }
    bfs(src, dest) {
        const q = new Queue();
        const visited = new Array(this.names.length).fill(false);
        const parent = new Array(this.names.length).fill(-1);
        q.enqueue(src);
        visited[src] = true;
        while (!q.isEmpty()) {
            const u = q.dequeue();
            if (u == dest) break;
            for (let E = this.adj[u].head; E; E = E.next) {
                if (!E.blocked && !visited[E.to]) {
                    visited[E.to] = true;
                    parent[E.to] = u;
                    q.enqueue(E.to);
                }

            }
        }
          return visited[dest] ? parent : null;
    }
    route(src, dest) {
        const parent = this.bfs(src, dest);
        if (parent == null) return null;
        const s = new Stack();
        for (let v = dest; v != -1; v = parent[v])s.push(v);
        const path = [];
        let total = 0;
      let  prev = -1;
        while (!s.isEmpty()) {
            const v = s.pop();

       if (prev != -1) total += this.adj[prev].find(v).d;
            path.push(v);
            prev = v;
         
        }
           return { path, total };
    }

}



// frontend
const campus = new Campus();
let highlight = [];
const $ = id => document.getElementById(id);
function say(msg, isErr) { const l = $('log'); l.textContent = msg; l.className = isErr ? 'err' : ''; }
function refreshSelects() {
    for (const id of ['pFrom', 'pTo', 'rFrom', 'rTo', 'lRef']) {
        const sel = $(id), old = sel.value;
        sel.innerHTML = campus.names.map(n => `<option>${n}</option>`).join('');
        if (campus.names.includes(old)) sel.value = old;
    }
    if (campus.names.length > 1) {
        if ($('pTo').value === $('pFrom').value) $('pTo').selectedIndex = 1;
        if ($('rTo').value === $('rFrom').value) $('rTo').selectedIndex = 1;

    }
}
function addLocation() {
    const name = $('locName').value.trim();
    if (!name) {
        return say('Enter Location name.', true)

    }
    if (campus.index(name) !== -1) return say(`"${name}" already exists.`, true);
    if (campus.names.length == 0) {
        campus.addLocation(name)
        $('locName').value = '';
        say(`Added ${name} as the starting point `);
        return render();
    }
    const ref = campus.index($('lRef').value);
    const angle = parseFloat($('lAngle').value), dist = parseFloat($('lDist').value);
    if (isNaN(angle)) return say('Enter the angle in degrees', true);
    if (dist < 0) return say('distance must be positve', true);
    const r = angle * Math.PI / 180;
    if (campus.isTaken(campus.x[ref] + dist * Math.sin(r), campus.y[ref] + dist * Math.cos(r))) {
        return say('Another location is already at that spot. Change the angle or distance.', true);
    }
    campus.addpolar(name, ref, angle, dist);
    const idx = campus.names.length - 1;
    if ($('lLink').checked) campus.addpath(ref, idx, Math.round(dist));
    highlight = [];
    $('locName').value = '';
    say(`Added ${name}:${dist}m at angle ${angle}  from ${campus.names[ref]}${$('lLink').checked ? ', with a pathway.' : '.'}`);
    render();

}

function pair(idFrom, idTo) {
    const a = campus.index($(idFrom).value), b = campus.index($(idTo).value);
    if (a === -1 || b === -1) { say('Add at least two locations first.', true); return null; }
    if (a === b) { say('Choose two different locations.', true); return null; }
    return [a, b];
}
function addpath() {
    const p = pair('pFrom', 'pTo'); if (!p) return;
    const d = parseInt($('pDist').value, 10);
    if (!(d > 0)) return say('Distance must be a positive number.', true);
    if (campus.findpath(p[0], p[1])) return say('That pathway already exists.', true);
    campus.addpath(p[0], p[1], d); highlight = [];
    say(`Pathway added: ${campus.names[p[0]]} <-> ${campus.names[p[1]]} (${d} m)`); 
    render();
}
function act(kind) {
    const p = pair('pFrom', 'pTo'); if (!p) return;
    if (!campus.findpath(p[0], p[1])) return say('No pathway between these locations.', true);
    if (kind === 'remove') campus.removepath(p[0], p[1]);
     else campus.setblock(p[0], p[1], kind === 'block');
    highlight = [];
    const verb = { block: 'blocked', reopen: 'reopened', remove: 'removed' }[kind];
    say(`Pathway ${campus.names[p[0]]} - ${campus.names[p[1]]} ${verb}.`); render();
}
function checkConnected(){
    const p = pair('rFrom', 'rTo'); if (!p) return;
    const ok = campus.bfs(p[0], p[1]) !== null;
    say(`${campus.names[p[0]]} and ${campus.names[p[1]]} are ${ok ? '' : 'NOT '}connected.`, !ok);
}
function findRoute() {
    const p = pair('rFrom', 'rTo'); if (!p) return;
    const r = campus.route(p[0], p[1]);
    if (!r) { highlight = []; render(); return say('No route available (paths may be blocked).', true); }
    highlight = [];
    for (let i = 0; i + 1 < r.path.length; i++) highlight.push(key(r.path[i], r.path[i + 1]));
    
    say(`Route: ${r.path.map(i => campus.names[i]).join(' -> ')}\nStops: ${r.path.length - 1} path(s)\nTotal distance: ${r.total} m`);
    render();

}
    const key = (a, b) => a < b ? a + '-' + b : b + '-' + a;
  function render() {                                                                                                                                                                 
    refreshSelects();                                                                                                                                                                 
    const n = campus.names.length, pos = [];                                                                                                                                          
    $('polarBox').style.display = n ? '' : 'none';                                                                                                                                    
    $('firstHint').style.display = n ? 'none' : '';                                                                                                                                   
    if (n) {                                                                                                                                                                          
      const minX = Math.min(...campus.x), maxX = Math.max(...campus.x);                                                                                                             
      const minY = Math.min(...campus.y), maxY = Math.max(...campus.y);                                                                                                             
      const sc = Math.min(520 / Math.max(maxX - minX, 1), 280 / Math.max(maxY - minY, 1), 2);                                                                                         
      const mx = (minX + maxX) / 2, my = (minY + maxY) / 2;                                                                                                                           
      for (let i = 0; i < n; i++) pos.push([350 + (campus.x[i] - mx) * sc, 220 - (campus.y[i] - my) * sc]);                                                 
    }                                                                                                                                                                                 
    let svg = '', seen = {};                                                                                                                                                          
    for (let u = 0; u < n; u++) for (let e = campus.adj[u].head; e; e = e.next) {                                                                                                     
      const k = key(u, e.to); if (seen[k]) continue; seen[k] = 1;                                                                                                                     
      const [x1, y1] = pos[u], [x2, y2] = pos[e.to], on = highlight.includes(k);                                                                                                      
      const col = on ? 'blue' : e.blocked ? 'red' : '#00000c';                                                                                                        
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${on ? 5 : 2.5}" ${e.blocked ? 'stroke-dasharray="7 5"' : ''}/>`;                       
      const mxp = (x1 + x2) / 2, myp = (y1 + y2) / 2;                                                                                                                                 
      svg += `<text x="${mxp}" y="${myp - 12}" font-size="12" fill="#5d7079" text-anchor="middle">${e.d} m</text>`;                                                                 
      if (e.blocked) {   // red cross mark on a blocked pathway                                                                                                                       
        svg += `<circle cx="${mxp}" cy="${myp}" r="11" fill="#fff" stroke="red" stroke-width="2"/>`;                                                                          
        svg += `<path d="M${mxp - 6} ${myp - 6}L${mxp + 6} ${myp + 6}M${mxp + 6} ${myp - 6}L${mxp - 6} ${myp + 6}" stroke="red" stroke-width="3.5" stroke-linecap="round"/>`;
      }                                                                                                                                                                               
    }                                                                                                                                                                                 
    for (let i = 0; i < n; i++) {                                                                                                                                                     
      svg += `<circle cx="${pos[i][0]}" cy="${pos[i][1]}" r="9" fill="brown"/>`;                                                                                              
      svg += `<text x="${pos[i][0]}" y="${pos[i][1] - 15}" font-size="13" font-weight="600" text-anchor="middle" fill="#14232b">${campus.names[i]}</text>`;                            
    }                                                                                                                                                                                 
    $('map').innerHTML = n ? svg : '<text x="350" y="220" text-anchor="middle" fill="#db3810">Add a location to start</text>';                                                         
    let rows = '<tr><th>Location</th><th>Connected to</th></tr>';                                                                                                                     
    for (let i = 0; i < n; i++) {                                                                                                                                                     
      let parts = [];                                                                                                                                                                 
      for (let e = campus.adj[i].head; e; e = e.next) parts.push(`${campus.names[e.to]} (${e.d} m${e.blocked ? ', blocked' : ''})`);                                               
      rows += `<tr><td>${campus.names[i]}</td><td>${parts.join(', ') || 'no pathways'}</td></tr>`;                                                                                    
    }                                                                                                                                                                                 
    $('adj').innerHTML = rows;                                                                                                                                                        
  }            
    campus.addLocation('Main Gate');                       // starting point of the map                                                                                                                                                                                          
    [['Library', 0, 90, 120], ['Canteen', 1, 180, 60], ['Hostel', 2, 90, 90],                             
    ['CS Block', 1, 0, 80], ['Auditorium', 4, 90, 110]].forEach(([name, ref, ang, d]) => {                
      campus.addpolar(name, ref, ang, d);                                                                 
      campus.addpath(ref, campus.names.length - 1, d);     
    });                                                    
    campus.addpath(0, 5, 250);   
    render();                          