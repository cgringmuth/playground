
class Edge {
  constructor(from, to, cost) {
    this.from = from
    this.to = to
    this.cost = cost
    this.selected = false
    this.highlightColor = undefined
    this.color = color(0,0,0)
  }

  highlight(color) { this.highlightColor = color}
  clearHighlight() { this.highlight(undefined) }

  select() {
    this.selected = true
  }

  draw() {
    let v0 = createVector(this.from.x * this.from.scale, 
                          this.from.y * this.from.scale)
    let v1 = createVector(this.to.x * this.from.scale, 
                          this.to.y * this.from.scale)
                     
    if (this.selected || this.highlightColor) {
      let c = this.selected ? color(255,200,0) : this.highlightColor

      drawArrow(v0, v1, c, this.from.r/1.4, undefined, 10, 6)
    }
    drawArrow(v0, v1, this.color, this.from.r/1.25, this.cost)
  }
}

function drawArrow(p0, p1, c, margin, str=undefined, arrowSize=7, sweight=2) {
  vec = p1.copy()
  vec.sub(p0)
  drawVec(p0, vec, c, margin, str, arrowSize, sweight)
}

function drawVec(base, vec, c, margin, str, arrowSize=7, sweight=2) {
  dir = vec.copy().normalize().mult(margin)
  vecTmp = vec.copy().sub(dir.copy().mult(2))

  push();
  stroke(c);
  strokeWeight(sweight);
  fill(c);
  translate(base.x + dir.x, base.y + dir.y)
  line(0, 0, vecTmp.x, vecTmp.y)
  rotate(vecTmp.heading())
  translate(vecTmp.mag() - arrowSize, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);

  if (str) {
    strokeWeight(1)
    translate(- vecTmp.mag()/2, -10);
    text(str, 0, 0)
  }

  pop();
}


function textBox(textStr, x, y) {
  let bbox = font.textBounds(textStr, x, y, 12);
  fill(255);
  stroke(0);
  rect(bbox.x, bbox.y, bbox.w, bbox.h);
  fill(0);
  noStroke();

  textFont(font);
  textSize(12);
  text(textStr, x, y);
}

class Node {
  static TYPE_NORMAL = 0
  static TYPE_START = 1
  static TYPE_END = 2

  constructor(x,y,id,type=Node.TYPE_NORMAL) {
    this.x = x
    this.y = y
    this.r = 30
    this.id = id
    this.scale = 60
    this.type = type
    this.selected = false
    this.highlightColor = undefined
    this.comment = undefined
  }

  setType(type) {
    this.type = type
  }

  select() { this.selected = true }

  highlight(col) { this.highlightColor = col }
  clearHighlight() { this.highlight(undefined) }

  setComment(text) { 
    if (text) {
      this.comment = {text: text, color: color(100,255,100) }
      let self = this
      setTimeout(function(){ self.comment.color = color(0,0,0) }, 1000);
   } else {
     this.comment = undefined
   }

  }

  draw() {
    noStroke()

    let c = color(255, 255, 255)
    switch (this.type) {
      case Node.TYPE_START:
        c = color(200, 75, 75)
        break;
      case Node.TYPE_END:
        c = color(75, 75, 200)
        break;
      default:
        break;
    }

    push()
    translate(this.x*this.scale, this.y*this.scale)

    if (this.selected || this.highlightColor) {
      let c = this.selected ? color(255,200,0) : this.highlightColor
      fill(c)
      circle(0, 0, this.r*1.25)
    }

    fill(c)
    circle(0, 0, this.r)

    fill(0,0,0);
    textAlign(CENTER, CENTER);
    text(this.id, 0, 0);

    if (this.comment) {
      textAlign(LEFT, BOTTOM);
      fill(this.comment.color)
      const dist = this.r*.5
      text(this.comment.text, dist, -dist)
    }
    pop()
  }
}


class Graph {
  constructor() {
    this.nodes = []
    this.edges = []
    this.nodeId = 0
  }

  addNode(x, y) {
    this.nodes.push(new Node(x, y, this.nodeId++))
  }

  addEdge(from, to, cost) {
    from = this.nodes[from]
    to = this.nodes[to]
    this.edges.push(new Edge(from, to, cost))
  }

  draw() {
    // draw nodes
    this.nodes.forEach(n => n.draw())

    // draw edges
    this.edges.forEach(e => e.draw())
  }

  setStartNode(id) {
    this.nodes[id].setType(Node.TYPE_START)
  }

  setEndNode(id) {
    this.nodes[id].setType(Node.TYPE_END)
  }

  select(n0, n1) {
    this.nodes[n0].select()
    this.nodes[n1].select()
    this.edges.forEach(e => {
      if (e.from.id === n0 && e.to.id === n1) {
        e.select()
      }
    })
  }
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// function sleep(ms) {
//   await _sleep(ms)
// }

 class Dijkstra {
  constructor(graph) {
    this.graph = graph
  }

  async calcRoute(start, end) {
    this.graph.setStartNode(start)
    this.graph.setEndNode(end)
  
    // initialize
    let unvisited = this.graph.nodes.map(i => i.id)
    let costs = Array(this.graph.nodes.length).fill(Number.MAX_VALUE)
    let selected = Array(this.graph.nodes.length).fill(-1)
    costs[start] = 0
    let curNode = start
    let lastNode = start
    let curCost = 0
    let self = this
    unvisited = unvisited.filter(item => item != curNode) // remove start
    const highlightColor = color(100,255,100)

    // run
    let idx = 0
    while (curNode != end) {
      // propagate cost
      let lastEdges = []


      for(let i=0; i<this.graph.edges.length; i++) {
        let e = this.graph.edges[i]

        if (e.from.id === curNode) {
          let cost = e.cost
          let newCost = curCost + cost
          lastEdges.push(e)
          e.highlight(highlightColor)
          if (costs[e.to.id] > newCost) {
            costs[e.to.id] = newCost
            this.graph.nodes[e.to.id].setComment('Cost: '+str(newCost))
            selected[e.to.id] = e.from.id
          }
          draw()
          await sleep(1000)
        }
      }
      lastEdges.forEach(e => e.clearHighlight())

      console.log(curNode, selected);
      // pick next node
      lastNode = curNode
      let costsTmp = unvisited.map(i => costs[i])
      // console.log(costsTmp);

      // get new node and cost
      curCost = Math.min(...costsTmp)
      curNode = unvisited[costsTmp.indexOf(curCost)]
      this.graph.nodes[lastNode].clearHighlight()
      this.graph.nodes[curNode].highlight(highlightColor)
      
      // mark current node as visited
      unvisited = unvisited.filter(item => item != curNode)

      // sanity check
      if (idx++ >= 300) {
        console.error("Couldn't find route!");
        break
      }

      draw()
      await sleep(1000)
    } 

    if (curNode != end) {
      return;
    }

    for (let i=end; ; i=selected[i]) {
      graph.select(selected[i], i)
      console.log(i, selected[i]);

      if (selected[i] == start) {
        break
      }
    }

    // this.graph.nodes.forEach(n => n.setComment(undefined))

  }
}

let graph

function setup() {
  // put setup code here
  createCanvas(600,600)

  graph = new Graph(6)
  graph.addNode(0, 1)
  graph.addNode(0, 3)
  graph.addNode(1, 2)
  graph.addNode(2, 6)
  graph.addNode(2, 0)
  graph.addNode(4, 5)
  graph.addNode(5, 3)

  graph.addEdge(0, 1, 50)
  graph.addEdge(0, 2, 5)
  graph.addEdge(2, 4, 150)
  graph.addEdge(5, 3, 15)
  graph.addEdge(3, 5, 2005)
  graph.addEdge(1, 3, 75)
  graph.addEdge(4, 6, 555)
  graph.addEdge(6, 5, 1005)
  graph.addEdge(5, 1, 15)
  // graph.addEdge(1, 5, 15)
  graph.addEdge(1, 6, 255)
  // graph.addEdge(6, 1, 15)

  // graph.select(0,2)
  // graph.select(2,4)
  // graph.select(4,6)
  // graph.select(6,5)

  let dijkstra = new Dijkstra(graph)

  route = dijkstra.calcRoute(0,5)

}

function draw() {
  push()
  clear()
  background(150)
  translate(150, 75)
  graph.draw()
  pop()
}