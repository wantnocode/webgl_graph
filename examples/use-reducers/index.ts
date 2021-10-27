/**
 * This example showcases sigma's reducers, which aim to facilitate dynamically
 * changing the appearance of nodes and edges, without actually changing the
 * main graphology data.
 */

import Sigma from "sigma";
import { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types";
import { MultiGraph } from "graphology";
import { NodeKey } from "graphology-types";
import { animateNodes } from "sigma/utils/animate";

import data from "./data.json";
import {nodes,links,TREE} from "../data"
import {force} from "../data/index3"
import NodeProgramImage from "sigma/rendering/webgl/programs/node.image";
// import "./clickedge"


// Retrieve some useful DOM elements:
const container = document.getElementById("sigma-container") as HTMLElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const searchSuggestions = document.getElementById("suggestions") as HTMLDataListElement;
var GraphState = true;  // true选中和拖动 2不能选中(拖动模式)

let highlighedNodes = new Set();
let highlighedEdges = new Set();
let selectedNodes = new Set();
let selectedEdges = new Set();
let hideNodes = new Set(); // 隐藏点集合
let lockNodes = new Set();
let undoList = [];
let redoList = [];

// Instantiate sigma:
const graph = new MultiGraph();

// graph.addNode("1",{x:10,y:10,size:10})
// graph.addNode("2",{x:11,y:10,size:10})
// graph.addEdge("1","2",{
//   index:0,

// })
// graph.addEdge("1","2",{
//   index:1,
//   size:10
// })
// graph.addEdge("1","2",{
//   index:2
// })
// graph.addEdge("1","2",{
//   index:3
// })
// graph.addEdge("1","2",{
//   index:4
// })

// graph.import(data);
nodes.map(node=>{
// console.log(node.fill)
let node_ = node.attributes;
graph.addNode(node.key,{
  // type:"image",
    x:node_.x * 1,
    y:node_.y * 1,
    color:"#ccc",
    zIndex:0,
    // index:node_.index,
    size:2,
    label:node.key,
    // image:"./DB.svg"
  })
})

links.map(link=>{
  if(link.attributes.index < 5){
    // console.log(link.attributes.index *1)
    graph.addEdge(link.source,link.target,{
      label: link.attributes.label,
      color: link.attributes.color,
      index:link.attributes.index * 1,
      p0:{},
      p1:{},
      size: 1,
    })
  }
})

// var o = {}
// // console.log(graph.nodes())
// graph.nodes().map(node=>{
//    // o[node]["x"] = graph.getNodeAttribute(node,"x");
//    // o[node]["y"] = graph.getNodeAttribute(node,"y");
// })

// animateNodes(graph, circularPositions, { duration: 2000, easing: "linear" })
// Type and declare internal state:
interface State {
  hoveredNode?: NodeKey;
  searchQuery: string;

  // State derived from query:
  selectedNode?: NodeKey;
  suggestions?: Set<NodeKey>;

  // State derived from hovered node:
  hoveredNeighbors?: Set<NodeKey>;
}
const state: State = { searchQuery: "" };

// Feed the datalist autocomplete values:
searchSuggestions.innerHTML = graph
  .nodes()
  .map((node) => `<option value="${graph.getNodeAttribute(node, "label")}"></option>`)
  .join("\n");

// Actions:
function setSearchQuery(query: string) {
  state.searchQuery = query;

  if (searchInput.value !== query) searchInput.value = query;

  if (query) {
    const lcQuery = query.toLowerCase();
    const suggestions = graph
      .nodes()
      .map((n) => ({ id: n, label: graph.getNodeAttribute(n, "label") as string }))
      .filter(({ label }) => label.toLowerCase().includes(lcQuery));

    // If we have a single perfect match, them we remove the suggestions, and
    // we consider the user has selected a node through the datalist
    // autocomplete:
    if (suggestions.length === 1 && suggestions[0].label === query) {
      state.selectedNode = suggestions[0].id;
      state.suggestions = undefined;

      // Move the camera to center it on the selected node:
      const nodePosition = renderer.getNodeDisplayData(state.selectedNode) as Coordinates;
      renderer.getCamera().animate(nodePosition, {
        duration: 500,
      });
    }
    // Else, we display the suggestions list:
    else {
      state.selectedNode = undefined;
      state.suggestions = new Set(suggestions.map(({ id }) => id));
    }
  }
  // If the query is empty, then we reset the selectedNode / suggestions state:
  else {
    state.selectedNode = undefined;
    state.suggestions = undefined;
  }

  // Refresh rendering:
  renderer.refresh();
}



function setHoveredNode(node?: NodeKey) {
  if(dragging || isFrameSelection)return;
  if (node) {
    state.hoveredNode = node;
    state.hoveredNeighbors = new Set(graph.neighbors(node));
  } else {
    state.hoveredNode = undefined;
    state.hoveredNeighbors = undefined;
  }

  // Refresh rendering:
  renderer.refresh();
}

// Bind search input interactions:
searchInput.addEventListener("input", () => {
  setSearchQuery(searchInput.value || "");
});
searchInput.addEventListener("blur", () => {
  setSearchQuery("");
});





// const nodeReducer = (node: any, data: any) => {
//   if (highlighedNodes.has(node)) return { ...data, color: "#f00", zIndex: 1 };
//   if (selectedNodes.has(node)) return { ...data, color: "#000", zIndex: 1 };

//   return data;
// };

// const edgeReducer = (edge: any, data: any) => {
//   if (highlighedEdges.has(edge)) return { ...data, color: "#f00", zIndex: 1 };
//   if (selectedEdges.has(edge)) return { ...data, color: "#f00", zIndex: 1 };

//   return data;
// };
const renderer = new Sigma(graph, container,{
  defaultEdgeType: "arrow",
  zIndex:true,
  // defaultEdgeColor: "#888",
  // defaultNodeType:"circle",
  // renderEdgeLabels: true,
  nodeProgramClasses: {
    image: NodeProgramImage,
    // border: NodeProgramBorder,
  },
  // renderNodeLabels: false,
});

// graph.nodes().forEach((node,index) => {
//   graph.mergeNodeAttributes(node, {
//     icon:"aj"
//     // color: "#000",
//   });
// });
graph.nodes().forEach((node,index) => {
  // console.log()
  let size = graph.neighbors(node).length  * 0.1;
  graph.mergeNodeAttributes(node, {
    // size: Math.max(4, Math.random() * 10),
    size: size < 2 ? 2: size,
    zIndex: size < 2 ? 2: size,
    icon:"aj",
    color: size < 2 ? "#000" : "#ff0033",
  });
});

graph.edges().forEach((edge,index) => {
  graph.mergeEdgeAttributes(edge, {
    // index:0
    // color: "#000",
  });
});


// Bind graph interactions:
renderer.on("enterNode", ({ node }) => {
  setHoveredNode(node);
});
renderer.on("leaveNode", () => {
  setHoveredNode(undefined);
});

// Render nodes accordingly to the internal state:
// 1. If a node is selected, it is highlighted
// 2. If there is query, all non-matching nodes are greyed
// 3. If there is a hovered node, all non-neighbor nodes are greyed
renderer.setSetting("nodeReducer", (node, data) => {
  const res: Partial<NodeDisplayData> = { ...data };

  if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
    res.label = "";
    res.color = "#f6f6f6";
  }

  if (state.selectedNode === node) {
    res.highlighted = true;
  } else if (state.suggestions && !state.suggestions.has(node)) {
    res.label = "";
    res.color = "#f6f6f6";
  }

  if (selectedNodes.has(node)){
    res.highlighted = true;
  };
  if(hideNodes.has(node)){
    res.hidden = true;
  }
  return res;
});

// Render edges accordingly to the internal state:
// 1. If a node is hovered, the edge is hidden if it is not connected to the
//    node
// 2. If there is a query, the edge is only visible if it connects two
//    suggestions
renderer.setSetting("edgeReducer", (edge, data) => {
  const res: Partial<EdgeDisplayData> = { ...data };

  if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
    res.hidden = true;
  }

  if (state.suggestions && (!state.suggestions.has(graph.source(edge)) || !state.suggestions.has(graph.target(edge)))) {
    res.hidden = true;
  }
  if (selectedEdges.has(edge)){
    res.color = "#f00";
  };
  return res;
});

renderer.on("clickStage", ({ event }) => {
    selectedNodes.clear();
    selectedEdges.clear();
    renderer.refresh();
    // 判断是否点击的是边
    graph.edges().forEach(edge=>{
       let from = graph.source(edge);
       let to = graph.target(edge);
       // from起点坐标
       let p = renderer.graphToViewport({x:graph.getNodeAttributes(from).x,y:graph.getNodeAttributes(from).y});
       // to终点坐标
       let p1 = renderer.graphToViewport({x:graph.getNodeAttributes(to).x,y:graph.getNodeAttributes(to).y})
       // 事件坐标
       let p_event = event;
       let index = graph.getEdgeAttribute(edge, 'index');
       let isOnLink = false;
       if(index == 0){
         if(doEdgeCollideWithPoint(p_event.x,p_event.y,p.x,p.y,p1.x,p1.y,4)){
            if(selectedEdges.size == 0){
              selectedEdges.add(edge);
            }
            renderer.refresh();
         }
         return
       }
       // console.log(graph.getNodeAttributes(from),graph.getNodeAttributes(to),renderer.viewportToGraph(p_event))
       // else{
          var x1 = graph.getNodeAttributes(from).x,
              x2 = graph.getNodeAttributes(to).x,
              y1 = graph.getNodeAttributes(from).y,
              y2 = graph.getNodeAttributes(to).y;
          // graph.getNodeAttributes(from),
          // graph.getNodeAttributes(to),
          var p_event_graph = renderer.viewportToGraph(p_event);
         //var x1 = renderer.viewportToGraph(p).x,y1 = renderer.viewportToGraph(p).y,
         //x2 = renderer.viewportToGraph(p1).x, y2 = renderer.viewportToGraph(p1).y
         var x_ = (x1 + x2) / 2 ,   // 俩点中点
              y_ = (y1 + y2) / 2;
          if(index % 2 === 0){
            var k = index / 100;
            var X = x_ - (k * (y1 - y_)) / Math.sqrt((x1 - x_) * (x1 - x_) + (y1 - y_) * (y1 - y_));
            var Y = y_ + (k * (x1 - x_)) / Math.sqrt((x1 - x_) * (x1 - x_) + (y1 - y_) * (y1 - y_));

          }else{
            var k = (index + 1) / 100;
            var X = x_ + (k * (y1 - y_)) / Math.sqrt((x1 - x_) * (x1 - x_) + (y1 - y_) * (y1 - y_));
            var Y = y_ - (k * (x1 - x_)) / Math.sqrt((x1 - x_) * (x1 - x_) + (y1 - y_) * (y1 - y_));
          }
       
       if((doEdgeCollideWithPoint(
               p_event_graph.x,
               p_event_graph.y,
               x1,
               y1,
               X,
               Y,
               2 / 100
             )
           )
           || (doEdgeCollideWithPoint(
                 p_event_graph.x,
                 p_event_graph.y,
                 X,
                 Y,
                 x2,
                 y2,
                 2 / 100
               )
           )
         ) {
         if(selectedEdges.size == 0){
            selectedEdges.add(edge);
          }
          renderer.refresh();
       } 
      
       
    })
});

function doEdgeCollideWithPoint(
  x: number,
  y: number,
  xS: number,
  yS: number,
  xT: number,
  yT: number,
  thickness: number,
): boolean {
  // Check first if point is out of the rectangle which opposite corners are the
  // source and the target, rectangle we expand by `thickness` in every
  // directions:
  if (x < xS - thickness && x < xT - thickness) return false;
  if (y < yS - thickness && y < yT - thickness) return false;
  if (x > xS + thickness && x > xT + thickness) return false;
  if (y > yS + thickness && y > yT + thickness) return false;

  const distance =
    Math.abs((xT - xS) * (yS - y) - (xS - x) * (yT - yS)) / Math.sqrt(Math.pow(xT - xS, 2) + Math.pow(yT - yS, 2));
  return distance < thickness / 2;
}


function undo() {
    if(undoList.length == 0)return;
    var node = undoList[undoList.length - 1]
    var position = {
      x:0,
      y:0
    };
    position.x = graph.getNodeAttributes(node.id).x;
    position.y = graph.getNodeAttributes(node.id).y;
    var pos = renderer.viewportToGraph(position);
    // redoList.push({
    //   id:node.id,
    //   x:pos.x,
    //   y:pos.y
    // })
    // const pos = renderer.viewportToGraph(node);
    graph.setNodeAttribute(node.id, "x", node.x);
    graph.setNodeAttribute(node.id, "y", node.y);
    // redoList.push(node);
    // console.log(redoList)
    undoList = undoList.slice(0,undoList.length - 1);

}

function redo() {
  if(redoList.length == 0)return;
  var node = redoList[redoList.length - 1];
  
    // const pos = renderer.viewportToGraph(node);
  graph.setNodeAttribute(node.id, "x", node.x);
  graph.setNodeAttribute(node.id, "y", node.y);
  // undoList.push(node);
  redoList = redoList.slice(0,redoList.length - 1);

}

function hide(){
  selectedNodes.forEach(node=>{
    hideNodes.add(node);
  })
  renderer.refresh();
}

function show(){
  // selectedNodes.forEach(node=>{
  //   hideNodes.add(node);
  // })
  hideNodes.clear();
  renderer.refresh();
}

function drag(){
  GraphState = false;
}

function select(){
  GraphState = true;
}

function tree() {
  graph.clear();
  TREE.nodes.map(node=>{
  // // console.log(node.fill)
  // let node_ = node.attributes;
  graph.addNode(node.id,{
    // type:"image",
      x:node.x * 1,
      y:node.y * 1,
      color:"red",
      // index:node_.index,
      size:1,
      label:node.id,
      // image:"./DB.svg"
    })
  })

  TREE.links.map(link=>{
    // if(link.attributes.index < 1){
      // console.log(link.attributes.index *1)
      graph.addEdge(link.from,link.to,{
        // label: link.attributes.label,
        // color: link.attributes.color,
        // index:link.attributes.index *1,
        // p0:{},
        // p1:{},
        size: 0.5
      })
    // }
  })
  searchSuggestions.innerHTML = "";
  searchSuggestions.innerHTML = graph
  .nodes()
  .map((node) => `<option value="${graph.getNodeAttribute(node, "label")}"></option>`)
  .join("\n");
}

// console.log(force)
function force_() {

  graph.clear();
  force.nodes.map(node=>{
  // // console.log(node.fill)
  // let node_ = node.attributes;
  graph.addNode(node.id,{
    // type:"image",
      x:node.x * 1,
      y:node.y * 1,
      color:"red",
      // index:node_.index,
      size:1,
      label:node.id,
      // image:"./DB.svg"
    })
  })

  force.links.map(link=>{
    // if(link.attributes.index < 1){
      // console.log(link.attributes.index *1)
      graph.addEdge(link.from,link.to,{
        // label: link.attributes.label,
        // color: link.attributes.color,
        // index:link.attributes.index *1,
        // p0:{},
        // p1:{},
        size: 0.5
      })
    // }
  })
  graph.nodes().forEach((node,index) => {
    // console.log()
    let size = graph.neighbors(node).length  * 0.1;
    graph.mergeNodeAttributes(node, {
      // size: Math.max(4, Math.random() * 10),
      size: size < 2 ? 2: size > 30 ? 30 : size,
      icon:"aj",
      color: size < 2 ? "#000" : "#ff0033",
    });
  });

  graph.edges().forEach((edge,index) => {
    graph.mergeEdgeAttributes(edge, {
      // index:0
      // color: "#000",
    });
  });
  searchSuggestions.innerHTML = "";
  searchSuggestions.innerHTML = graph
  .nodes()
  .map((node) => `<option value="${graph.getNodeAttribute(node, "label")}"></option>`)
  .join("\n");
}

document.getElementById("undo").onclick = undo;
document.getElementById("redo").onclick = redo;
document.getElementById("hide").onclick = hide;
document.getElementById("show").onclick = show;
document.getElementById("drag").onclick = drag;
document.getElementById("select").onclick = select;
document.getElementById("tree").onclick = tree;
document.getElementById("force").onclick = force_;



const camera = renderer.getCamera();

const captor = renderer.getMouseCaptor();

let draggedNode: NodeKey | null = null,
  dragging = false;

//////////////////////
renderer.on("downNode", (e) => {
  dragging = true;
  var pos = renderer.viewportToGraph(e.event);
  undoList.push({
    id:e.node,
    x:pos.x,
    y:pos.y
  })
  draggedNode = e.node;
  camera.disable();
  isFrameSelection = false;
});

var timer = null;
var isFrameSelection = false;
captor.on("mouseup", () => {
  dragging = false;
  draggedNode = null;
  camera.enable();
  clearTimeout(timer)
  if(isFrameSelection){
    if(Math.abs(selection_w) > 0 || Math.abs(selection_h) > 0){
      // 判断是否框选
      // if(selection_w < 0 && selection_h < 0) {

      // }
      var x1 = selection_w + down_x;
      var y1 = selection_h + down_y;
      // console.log(pos.x < down_x && pos.x > x1 && pos.y > y1 && pos.y < down_y)
      graph.nodes().forEach(node=>{
        let pos = renderer.graphToViewport({x:graph.getNodeAttributes(node).x,y:graph.getNodeAttributes(node).y})
        
        if((pos.x > down_x && pos.x < x1 && pos.y > down_y && pos.y < y1) 
          || (pos.x > down_x && pos.x < x1 && pos.y > y1 && pos.y < down_y) 
          || (pos.x < down_x && pos.x > x1 && pos.y > down_y && pos.y < y1)
          || (pos.x < down_x && pos.x > x1 && pos.y > y1 && pos.y < down_y)){
          // 右下方向 x + y +
          selectedNodes.add(node)
          // renderer.refresh();
        }  
        // if(pos.x > down_x && pos.x < x1 && pos.y > y1 && pos.y < down_y){
        //   // 右上方向 x + y-
        //   selectedNodes.add(node)
        //   // renderer.refresh();
        // }
        // if(pos.x < down_x && pos.x > x1 && pos.y > down_y && pos.y < y1){
        //   // 右上方向 x + y-
        //   selectedNodes.add(node)
        //   // renderer.refresh();
        // }
        // if(pos.x < down_x && pos.x > x1 && pos.y > y1 && pos.y < down_y){
        //   // 左上角方向
        //   selectedNodes.add(node)
        // }
      })

      links.map(link=>{
        if(selectedNodes.has(link.from) &&selectedNodes.has(link.to)){
          selectedEdges.add(link.id);
        }
      })
      renderer.refresh();
       
    }
    isFrameSelection = false;
    let canvas = document.querySelector("canvas");
    renderer.getCanvasContexts().mouse.clearRect(0,0,canvas.width,canvas.height);
  }
});

var down_x,down_y,selection_w,selection_h;
function draw(ctx,down_x,down_y,w,h){
  // console.log(down_x,down_y,w,h)
    let canvas = document.querySelector("canvas");
    ctx.fillStyle = "rgba(22,124,243,0.07)";
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillRect(down_x,down_y,w,h);
}
captor.on("mousemove", (e) => {

  if (!dragging || !draggedNode){

      if(isFrameSelection){
          // 是否可以拖拽
         selection_w = e.x - down_x;
         selection_h = e.y - down_y;
        draw(renderer.getCanvasContexts().mouse,down_x,down_y,selection_w,selection_h);
      }
      return;
  } 

  // Get new position of node

  // graph.setNodeAttribute(draggedNode, "x", pos.x);
  // graph.setNodeAttribute(draggedNode, "y", pos.y);
  // setTimeout(function(){
    window.requestAnimationFrame(function(){
    // console.log(e)
    if(!draggedNode) return;
    isFrameSelection = false;
    const pos = renderer.viewportToGraph(e);
    graph.setNodeAttribute(draggedNode, "x", pos.x);
    graph.setNodeAttribute(draggedNode, "y", pos.y);
  })
  // })
});



captor.on("mousedown", (event) => {
   // 判断是否框选 可进行边遍历 然后拿已选中的点进行判断。
  var _down_x = event.x;
  var _down_y = event.y;
  // console.log(event.x,event.y)
  timer = setTimeout(function(){
    if(Math.abs(_down_x - event.x) < 5 && Math.abs(_down_y - event.y) < 5){
      camera.disable();
      isFrameSelection = true;
      down_x = event.x;
      down_y = event.y;
    }
  },600)
});


renderer.on("clickNode", ({ node, captor, event }) => {
  if(!GraphState){
    return;
  };
  // console.log("Clicking:", node, captor, event);
  selectedNodes.clear();
  if(selectedNodes.has(node)){
    selectedNodes.delete(node);
  }else{
    selectedNodes.add(node);
  }
  renderer.refresh();
});


renderer.on("rightClickNode",(node,captor,event)=>{
  // console.log(node)
  var m = node.event.x;
  var n = node.event.y;
  var pos_ = renderer.viewportToGraph({x:m,y:n})
  var r = 100;
  var arr = {};
  var len = Math.floor(Math.random()* 10);  

  for(let i = 0; i < len; i++){
    let node_ = node.node + i + i + i;
    var hudu = (2 * Math.PI / 360)* (360 / len) * i;

    var X = m + Math.sin(hudu) * r;

    var Y = n - Math.cos(hudu) * r; 
    const pos = renderer.viewportToGraph({x:X,y:Y});
    // arr[node_]["x"] = pos.x;
    // arr[node_]["y"] = pos.y;
    arr[node_] = {
      "x":pos.x,
      "y":pos.y
    }
    graph.addNode(node_,{
    // type:"image",
      x:pos_.x,
      y:pos_.y,
      color:"red",
      // index:node_.index,
      size:2,
      label:node_,
      // image:"./DB.svg"
    })
    graph.addEdge(node.node,node_,{
    // type:"image",
      // x:X,
      // y:Y,
      // color:"red",
      // index:node_.index,
      size:0.5,
      // label:node_,
      // image:"./DB.svg"
    })
  }

  animateNodes(graph, arr, { duration: 200, easing: "cubicIn" });


})




/***
** 拓展组合API

/


/*

最大化选区
*/

function setRadio2Maximize(){

  camera.ratio = 0.01;
  renderer.refresh();

}

 
/*
@name 设置是否锁定节点
@param node string lock_node nodeid
@param state boolean lock_node state false为不锁定true为锁定
*/
function setLockNodeState(node,state){
  if(state){
    lockNodes.add(node);
  }else{
    if(lockNodes.has(node)){
      lockNodes.delete(node);
    }
  }
}



/*
@name 拖动 选中模式切换
@param state boolean true为拖动和选中 false为拖动
*/

// function changeGraphMode(state){
//   // camera.enable();
//   GraphState = state
// }
// changeGraphMode()




/*
@name 图数据添加
@param nodes array 添加的节点集合
@param edges array 添加的边集合
@param isAnimate boolean 添加是否执行动画
*/
function addGraphData(nodes,edges,isAnimate){
  if(nodes && nodes.length > 0){
    // graph.addNode()
  }
  if(edges && edges.length > 0){
    // graph.addEdge()
  }


  // isAnimate()

}



/*
@name  更新图数据
@param nodes array 更新的节点集合
@param edges array 更新的边集合
@param isAnimate boolean 更新是否执行动画
 */
function updateGraphData(nodes,edges,isAnimate) {
  if(nodes && nodes.length > 0){
    nodes.map(node=>{
      graph.mergeNodeAttributes(node.id,{
        //
      })
    })
  }
  if(edges && edges.length > 0){
    edges.map(edge=>{
      graph.mergeEdgeAttributes(edge,{
        //
      })
    })
  }
  // isAnimate()

}


/*
@name 初始化数据 (changelayout也走这里)
@param nodes array
@param edges array
*/
function initGraph(nodes,edges){

}





/*
@name  判断是否属于(在)矩形中
@param p object 线段起点坐标
@param p1 object 线段终点点坐标
@param q object 目标点
@param ratio number 当前相机缩放比例 
@return isOnclick  Boolean  

*/
function onRect(p,p1,q,ratio){
    var x1 = p.x,
      y1 = p.y,
      x2 = p1.x,
      y2 = p1.y,
      h = 0.2 / ratio;
    // h = 5
    // 左右偏移 rect
    var alpha= Math.atan((y2-y1)/(x2-x1));

    var x3= x2 - Math.round(h*Math.sin(alpha));

    var y3= y2 + Math.round(h*Math.cos(alpha));

    var x4= x1 - Math.round(h*Math.sin(alpha));

    var y4= y1 + Math.round(h*Math.cos(alpha));


    var x3_ = x2 + Math.round(h*Math.sin(alpha));

    var y3_ = y2 - Math.round(h*Math.cos(alpha));

    var x4_ = x1 + Math.round(h*Math.sin(alpha));

    var y4_ = y1 - Math.round(h*Math.cos(alpha));


    function point(){
     this.x=0;
     this.y=0;
    }

    //计算一个点是否在多边形里
    // 点 点集(多维)
    function PointInPoly(pt, poly) { 
        for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) 
            ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y)) 
            && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) 
            && (c = !c); 
        return c; 
    }
 


    var isInRect = PointInPoly(q,[p,p1,{x:x3,y:y3},{x:x4,y:y4}])|| PointInPoly(q,[p,p1,{x:x3_,y:y3_},{x:x4_,y:y4_}]);
    return isInRect
}




/*
@events点击是否同线 
*/
function onSegment (p1, p2, q, ratio){
    // if x || y 为0 需要考虑
    let k1:any = ((p2.y - p1.y)/(p2.x-p1.x)).toFixed(3);
    let k2:any = ((q.y-p1.y)/(q.x-p1.x)).toFixed(3);

    let diff:number = Math.abs(k2 * 1 - k1 * 1) - (ratio < 0.3 ? ratio * 2 : ratio) * 0.1;

    // space
       // console.log(p1,p2,diff)
    if(diff <= Number.EPSILON){
       if((p1.x < q.x && p2.x < q.x) 
         || (p1.y < q.y && p2.y < q.y) 
         || (p1.x > q.x && p2.x > q.x) 
         || (p1.y > q.y && p2.y > q.y)){
         return false;
       }
       return true;
      // }
    }
}



window.oncontextmenu = function (e) {
  // body...
  e.preventDefault();
}