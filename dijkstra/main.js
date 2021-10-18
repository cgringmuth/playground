
class Edge {
  static TYPE_COST_FIXED = 0
  static TYPE_COST_CALCULATE = 1

  constructor(from, to, cost) {
    this.from = from
    this.to = to
    this.type = cost ? Edge.TYPE_COST_FIXED : Edge.TYPE_COST_CALCULATE
    if (this.type == Edge.TYPE_COST_CALCULATE) {
      this.cost = from.distance(to)
    } else {
      this.cost = cost
    }
    this._route = false
    this.highlightColor = undefined
    this.color = color(0,0,0)
  }

  highlight(color) { this.highlightColor = color}
  clearHighlight() { this.highlight(undefined) }

  route() { this._route = true }
  clearRoute() { this._route = false }

  updateCost() {
    this.cost = this.from.distance(this.to)
  }

  draw() {
    let v0 = createVector(this.from.x, this.from.y)
    let v1 = createVector(this.to.x, this.to.y)
                     
    if (this._route || this.highlightColor) {
      let c = this._route ? color(255,200,0) : this.highlightColor

      drawArrow(v0, v1, c, this.from.r/1.4, undefined, 10, 6)
    }
    drawArrow(v0, v1, this.color, this.from.r/1.25, this.cost.toFixed(2))
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
    this.type = type
    this.selected = false
    this._route = false
    this.highlightColor = undefined
    this.comment = undefined
    this.color = color(255, 255, 255)
  }

  distance(n) {
    const dx = n.x - this.x
    const dy = n.y - this.y
    return Math.sqrt(dx*dx + dy*dy)
  }

  setType(type) {
    this.type = type
  }

  select() { this.selected = true }
  deselect() { this.selected = false }
  route() { this._route = true }
  clearRoute() { this._route = false }

  highlight(col) { this.highlightColor = col }
  clearHighlight() { this.highlight(undefined) }

  setComment(text) { 
    if (text) {
      this.comment = {text: text, color: color(100,255,100) }
      let self = this
      setTimeout(() => { self.comment.color = color(0,0,0) }, 1000);
   } else {
     this.comment = undefined
   }

  }

  draw() {
    noStroke()

    let c = this.color
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
    translate(this.x, this.y)

    if (this._route || this.highlightColor) {
      let c = this._route ? color(255,200,0) : this.highlightColor
      fill(c)
      circle(0, 0, this.r*1.25)
    }

    c = this.selected ? color(100, 200, 200) : c
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

  isInside(x, y) {
    const dx = x-this.x
    const dy = y-this.y
    const inside = Math.sqrt(dx*dx + dy*dy) <= this.r
    return inside
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

  route(n0, n1) {
    this.nodes[n0].route()
    this.nodes[n1].route()
    this.edges.forEach(e => {
      if (e.from.id === n0 && e.to.id === n1) {
        e.route()
      }
    })
  }

  reset() {
    this.nodes.forEach(n => n.clearRoute())
    this.edges.forEach(e => e.clearRoute())
  }

  getObject(x,y) {
    const clickedObjs = this.nodes.filter(n => n.isInside(x,y))
    if (clickedObjs.length > 0) {
      return clickedObjs[0]
    }
    return undefined
  }

  updateCost(node) {
    this.edges
      .filter(e => e.to === node || e.from === node)
      .forEach(e => e.updateCost())
  }
}


function sleep(_ms) {
  return new Promise(resolve => setTimeout(resolve, _ms))
}



function getClosest(arr, num) {
  let idx = Number.MAX_VALUE
  let diff = Number.MAX_VALUE
  for(let i=0; i<arr.length; i++) {
    const curDiff = Math.abs(arr[i]-num)
    if (diff > curDiff) {
      idx = i
      diff = curDiff
    }
  }
  return idx
}

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
            this.graph.nodes[e.to.id].setComment('Cost: '+str(newCost.toFixed(2)))
            selected[e.to.id] = e.from.id
          }
          render()
          await sleep(ms)
        }
      }
      lastEdges.forEach(e => e.clearHighlight())

      // pick next node
      lastNode = curNode
      const costsTmp = unvisited.map(i => costs[i])
      // console.log(costsTmp);

      // get new node and cost
      curCost = Math.min(...costsTmp)
      // curNode = unvisited[costsTmp.indexOf(curCost)]
      curNode = unvisited[getClosest(costsTmp, curCost)]
      this.graph.nodes[lastNode].clearHighlight()
      this.graph.nodes[curNode].highlight(highlightColor)
      
      // mark current node as visited
      unvisited = unvisited.filter(item => item != curNode)

      // sanity check
      if (idx++ >= 300) {
        console.error("Couldn't find route!");
        break
      }

      render()
      await sleep(ms)

    } 

    this.graph.nodes[curNode].clearHighlight()
    if (curNode != end) {
      return;
    }

    for (let i=end; ; i=selected[i]) {
      graph.route(selected[i], i)
      // console.log(i, selected[i]);

      if (selected[i] == start) {
        break
      }
    }

  }
}

let graph
let capturer
let stopRec=false
const ms=150
let canvas

function setup() {

  // Create a capturer that exports an animated GIF
  // Notices you have to specify the path to the gif.worker.js 
  // capturer = new CCapture({ 
  //       format: 'gif',
  //       // workersPath: 'libs/gifjs/',
  //       verbose: true,
  //       framerate: 10
  //     })

  // put setup code here
  var p5canvas = createCanvas(450,450)
  canvas = p5canvas.canvas

  graph = new Graph(6)
  graph.addNode(50, 100)
  graph.addNode(50, 220)
  graph.addNode(110, 160)
  graph.addNode(170, 400)
  graph.addNode(170, 40)
  graph.addNode(290, 340)
  graph.addNode(350, 220)

  graph.addEdge(0, 1)
  graph.addEdge(0, 2)
  graph.addEdge(2, 4)
  graph.addEdge(5, 3)
  graph.addEdge(3, 5)
  graph.addEdge(1, 3)
  graph.addEdge(4, 6)
  graph.addEdge(6, 5)
  graph.addEdge(5, 1)
  graph.addEdge(1, 6)

  // graph.addEdge(0, 1, 50)
  // graph.addEdge(0, 2, 5)
  // graph.addEdge(2, 4, 150)
  // graph.addEdge(5, 3, 15)
  // graph.addEdge(3, 5, 2005)
  // graph.addEdge(1, 3, 75)
  // graph.addEdge(4, 6, 555)
  // graph.addEdge(6, 5, 1005)
  // graph.addEdge(5, 1, 15)
  // graph.addEdge(1, 6, 255)

  let dijkstra = new Dijkstra(graph)
  route = dijkstra.calcRoute(0,5)

}

function draw() {
  render()
  // circle(mouseX, mouseY, 30)

}

let capStarted = false
function render() {
  // if (!capStarted) {
  //   capturer.start()
  //   capStarted = true
  // }
  push()
  clear()
  background(150)
  // translate(50, 40)
  graph.draw()
  pop()

  // capturer.capture(canvas)
  // if (stopRec) {
  //   capturer.stop()
  //   capturer.save()
  //   noLoop()
  // }
}

let curObj

function mousePressed() {
  curObj = graph.getObject(mouseX, mouseY)
}

let lastObj
function mouseMoved() {
  curObj = graph.getObject(mouseX, mouseY)
  if (lastObj && lastObj != curObj) {
    lastObj.deselect()
  }
  if (curObj) {
    curObj.select()
    lastObj = curObj
  }
}

function mouseReleased() {
  curObj = undefined
}

function mouseDragged() {
  if (!curObj) { return }
  curObj.x = mouseX
  curObj.y = mouseY
  graph.updateCost(curObj)
}


function keyPressed() {
  if (keyCode === 82) {
    graph.reset()
    let dijkstra = new Dijkstra(graph)
    route = dijkstra.calcRoute(0,5)
  }
}