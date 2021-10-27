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
    // console.log(isInRect)
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