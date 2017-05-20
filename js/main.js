/*
 * ネットワークシミュレータのプログラム
 * メインのコードを書いている
 *
 * do: 最低限の動作を作成完了
 *     データを渡すアルゴリズムがまだ最低限の仕様なので、改良予定
 *
 * bg: 勝手に線が消える (時間を置くと消える･･･? しかも消えた線が勝手に復活する･･･ 原因不明 Canvasの仕様?)(中)
 *
 */

$(function(){


// 変数の定義

if ( typeof NSF === "undefined" ) var NSF = {};

// nsf-all var
NSF.pcNode = 0;  // PCの数
NSF.ruNode = 0;  // Routerの数
NSF.swNode = 0;  // Switchの数
NSF.svNode = 0;  // Serverの数
NSF.lanNode = 0; // LanNodeの数

// nsf-main var
NSF.mainDropFlg     = true; // Draggableのフラグ
NSF.dropNodeInt     = 0;    // DropNodeの個数
NSF.dropNodeName    = "";   // DropNodeの名前
NSF.dropContextName = "";   // DropNodeのContextMenuの名前

// nsf-canvas var
NSF.points          = []; // ドラッグ時のマウスの座標の配列
NSF.lanArrClass     = []; // nsf-main-canvasのクラスの配列
NSF.lanArrWidth     = []; // LANの帯域幅の配列
NSF.lanWidth        = 2;  // LANの幅
NSF.lanFlag;              // LANのフラグ   (画像に乗っているとき)
NSF.lanFlaglink;          // LANのフラグ2  (lanLinkがあるとき)
NSF.lanFlagPoint;         // LANのフラグ3  (lanDownが実行されたとき)
NSF.lanFlagDelet;         // LANのフラグ4  (lanDownの削除するとき)
NSF.lanFlagMove;          // LANのフラグ5  (lanMoveDownが実行されたとき)
NSF.elLanMoveThis;        // LANMoveのクエリのキャッシュ
NSF.addCtx;               // 追加したCanvasのAPIにアクセスできるオブジェクト
NSF.addCanvas;            // 追加したCanvasを格納
NSF.canvasWidth      = $('#nsf-main').width();  // nsf-mainの幅
NSF.canvasHeight     = $('#nsf-main').height(); // nsf-mainの高さ
NSF.mainCanvasWidth  = $('#nsf-main-canvas')[0].getBoundingClientRect().left - 35;
NSF.mainCanvasHeight = $('#nsf-main-canvas')[0].getBoundingClientRect().top - 35;
NSF.mainCtx          = $('#nsf-main-canvas')[0].getContext('2d'); // nsf-main-canvasをAPIにアクセスできるオブジェクト
NSF.mainCtx.strokeStyle = '#2fb9fe';                              // 線の色を青色に設定

// nsf-glay var
NSF.bGlayFladg = false; // glayLayerのフラグ

// nsf-context var
// contextMenuのitemsオブジェクト (PC)
NSF.conitems = {
  sm: {
    name: "SM",
    className: "context-SM",
    type: "text",
    value: "24",
  },
  ip: {
    name: "IPアドレス",
    className: "context-IP",
    type: "text",
  },
  "sep1": "---------",
  "del": {name: "削除"},
  "qui": {name: "閉じる"}
}
// contextMenuのitemsオブジェクト (Router)
NSF.conitems_2 = {
  sm_1: {
    name: "SM",
    className: "context-SM",
    type: "text",
    value: "24",
  },
  ip_1: {
    name: "IPアドレス",
    className: "context-IP",
    type: "text",
  },
  sm_2: {
    className: "context-SM",
    type: "text",
    value: "24",
  },
  ip_2: {
    className: "context-IP",
    type: "text",
  },
  "sep1": "---------",
  "del": {name: "削除"},
  "qui": {name: "閉じる"}
}
// contextMenuのeventオブジェクト (PC)
NSF.conev = {
  // contextMenuが現れた時
  show: function(opt) {
    $.contextMenu.setInputValues(opt, this.data());
  },
  // contextMenuが隠れた時
  hide: function(opt) {
    $.contextMenu.getInputValues(opt, this.data());
    $("#nsf-right dt:contains('"+ opt.$trigger[0].alt +"') + dd p span:first").text(this.data().ip);
    $("#nsf-right dt:contains('"+ opt.$trigger[0].alt +"') + dd p span:last").text(this.data().sm);
  }
}
// contextMenuのeventオブジェクト (Router)
NSF.conev_2 = {
  // contextMenuが現れた時
  show: function(opt) {
    $.contextMenu.setInputValues(opt, this.data());
  },
  // contextMenuが隠れた時
  hide: function(opt) {
    $.contextMenu.getInputValues(opt, this.data());
    $("#nsf-right dt:contains('"+ opt.$trigger[0].alt +"') + dd p:nth-of-type(1) span:first").text(this.data().ip_1);
    $("#nsf-right dt:contains('"+ opt.$trigger[0].alt +"') + dd p:nth-of-type(1) span:last").text(this.data().sm_1);
    $("#nsf-right dt:contains('"+ opt.$trigger[0].alt +"') + dd p:nth-of-type(2) span:first").text(this.data().ip_2);
    $("#nsf-right dt:contains('"+ opt.$trigger[0].alt +"') + dd p:nth-of-type(2) span:last").text(this.data().sm_2);
  }
}






// 関数の定義


// nsf-nav Fnction

// 全要素の削除
NSF.fnAllReset = function() {
  // 変数のリセット
  NSF.pcNode  = 0;
  NSF.swNode  = 0;
  NSF.svNode  = 0;
  NSF.ruNode  = 0;
  NSF.lanNode = 0;
  // コンソールとトポロジーの文字を削除
  $("#nsf-right dl").html("");
  $("#nsf-console").html("");
  // lanLinkがある時
  if($("#nsf-main .ui-draggable").hasClass("lanLink")) {
    $("#nsf-main").off("mousedown", NSF.fnLanMoveDown);
    $("#nsf-main").off("mouseup", NSF.fnLanMoveUp);
    $("html").off("mouseup", NSF.fnLanMoveOutUp);
  }
  // 画像と線の削除
  $("#nsf-main img").remove();
  $('#nsf-main-canvas').removeClass();
  NSF.mainCtx.clearRect(0, 0, NSF.canvasWidth, NSF.canvasHeight);
}

// パケット画像の変更
NSF.fnPacketChenge = function(set1, set2, set3) {
  if($("#"+ set1 +"-packet").attr("src") === "img/"+ set1 +"_1.png") {
    $("#"+ set1 +"-packet").attr("src", "img/"+ set1 +"_2.png");
    if($("#"+ set2 +"-packet").attr("src") === "img/"+ set2 +"_2.png") {
      $("#"+ set2 +"-packet").attr("src", "img/"+ set2 +"_1.png");
    }
    else if($("#"+ set3 +"-packet").attr("src") === "img/"+ set3 +"_2.png") {
      $("#"+ set3 +"-packet").attr("src", "img/"+ set3 +"_1.png");
    }
  }
  else {
    $("#"+ set1 +"-packet").attr("src", "img/"+ set1 +"_1.png");
  }
}

// パケットの追加
NSF.fnPacketAdd = function() {
  var elthis = $(this);
  // get-nodeを付加する処理
  if($("#get-packet").attr("src") === "img/get_2.png") {
    // get-nodeがあるとき
    if(elthis.hasClass("get-node")) { }
    // send-nodeがあるとき
    else if(elthis.hasClass("send-node")) {
      elthis.removeClass("send-node");
      elthis.prev().remove();
      NSF.fnSetBadge(this, "get-node");
    }
    // get-node と send-nodeがないとき
    else {
      NSF.fnSetBadge(this, "get-node");
    }
  }
  // send-nodeを付加する処理
  else if($("#send-packet").attr("src") === "img/send_2.png") {
    // get-nodeがあるとき
    if(elthis.hasClass("get-node")) {
      $(".send-node").prev().remove();
      $("#nsf-main img").removeClass("send-node");
      elthis.removeClass("get-node");
      elthis.prev().remove();
      NSF.fnSetBadge(this, "send-node");
    }
    // send-nodeがあるとき
    else if(elthis.hasClass("send-node")) { }
    // get-node と send-nodeがないとき
    else {
      $(".send-node").prev().remove();
      $("#nsf-main img").removeClass("send-node");
      NSF.fnSetBadge(this, "send-node");
    }
  }
  // nodeをリセットする処理
  else if($("#reset-packet").attr("src") === "img/reset_2.png") {
    if(elthis.hasClass("get-node") || elthis.hasClass("send-node")) {
      elthis.prev().remove();
      elthis.removeClass("get-node");
      elthis.removeClass("send-node");
    }
  }
}

// パケットバッチの追加
NSF.fnSetBadge = function(e, node) {
  $(e).addClass(node);
  $(e).before("<img src='img/badge_"+ node +".png' class='"+ node +"2'>");
  $(e).prev().offset({
    top:  e.offsetTop - 15,
    left: e.offsetLeft + 42,
  });
}

// GlayLayerを表示 (New)
NSF.fnGlayOpen = function() {
  // glayLayerのフラグを true にする
  NSF.bGlayFladg = true;
  // ID glayLayerの座標と大きさの指定
  $("#glayLayer").css({
    display: 'block',
  });
  $("#glayLayer").animate({
    top:    $("#nsf-container").offset().top,
    left:   $("#nsf-container").offset().left,
    height: $("#nsf-container").height() - 4,
    width:  $("#nsf-container").width() - 4,
  }, 500);
}

// 左矢印ボタンが押されたとき
NSF.fnGlayInfoLeft = function() {
  $("#slideUl:not(:animated)")
  .css("margin-left", -1*$("#slideUl li").width())
  .prepend($("#slideUl li:last-child"))
  .animate({
    "margin-left" : 0
  }, function(){ });
}

// 右矢印ボタンが押されたとき
NSF.fnGlayInfoRight = function() {
  $("#slideUl:not(:animated)").animate({
    "margin-left" : -1*$("#slideUl li").width()
  }, function(){
    $("#slideUl").css("margin-left", "0");
    $("#slideUl").append($("#slideUl li:first-child"));
  });
}

// 問題のタイトルを押されたとき (Update)
NSF.fnGlayStudyTitleInfo = function() {
  $("#studyLeftTitle").text($(this).text());
}

// 問題の受信が押されたとき (Update)
NSF.fnGlayStudyInput = function() {
  // ajax通信でデータを受け取る
  $.ajax({
    type: 'POST',
    dataType: 'json',
    url: 'php/studyOutPut.php',
    data: { data : $("#studyLeftTitle").text() },
  }).done(function(studyData){
    console.log(studyData);
    if(studyData[0] === undefined) {
      $("#nsf-console").append("<p>> 指定したIDに問題がありません。</p>");
    } else {
      $("#nsf-console").append("<p>> 機器情報を受信しました。</p>");
      // 要素の全削除
      NSF.fnAllReset();
      // 変数の定義
      var studyWidth  = NSF.mainCanvasWidth + 35;
      var studyHeight = NSF.mainCanvasHeight + 35;
      NSF.pcNode = studyData[0].pc.node;
      NSF.ruNode = studyData[0].router.node;
      // nsf-main-canvasにクラスを追加
      for(var i = 0; i <= studyData[0].lanNode; i++) {
        $('#nsf-main-canvas').addClass("L_"+ NSF.lanNode);
        NSF.lanArrWidth[i] = 2;
        NSF.lanNode = i;
      }
      // PCの設定
      for(var i = 0; i < studyData[0].pc.node; i++) {
        // nsf-main に PC 画像を配置
        if(studyData[0].pc.send[i]) {
          $("#nsf-main").append('<img src="img/badge_send-node.png" class="send-node2" style="position: absolute; top: '+ (studyHeight + studyData[0].pc.badgeStyle[i].top) +'px; left: '+ (studyWidth + studyData[0].pc.badgeStyle[i].left) +'px">');
          $("#nsf-main").append('<img src="img/pc.png" class="context-menu-PC lanLink send-node '+ studyData[0].pc.lan[i] +'" alt="PC'+ i +'" style="position: absolute; top: '+ (studyHeight + studyData[0].pc.style[i].top) +'px; left: '+ (studyWidth + studyData[0].pc.style[i].left) +'px">');
        } else if(studyData[0].pc.get[i]) {
          $("#nsf-main").append('<img src="img/badge_get-node.png" class="get-node2" style="position: absolute; top: '+ (studyHeight + studyData[0].pc.badgeStyle[i].top) +'px; left: '+ (studyWidth + studyData[0].pc.badgeStyle[i].left) +'px">');
          $("#nsf-main").append('<img src="img/pc.png" class="context-menu-PC lanLink get-node '+ studyData[0].pc.lan[i] +'" alt="PC'+ i +'" style="position: absolute; top: '+ (studyHeight + studyData[0].pc.style[i].top) +'px; left: '+ (studyWidth + studyData[0].pc.style[i].left) +'px">');
        } else {
          $("#nsf-main").append('<img src="img/pc.png" class="context-menu-PC lanLink '+ studyData[0].pc.lan[i] +'" alt="PC'+ i +'" style="position: absolute; top: '+ (studyHeight + studyData[0].pc.style[i].top) +'px; left: '+ (studyWidth + studyData[0].pc.style[i].left) +'px">');
        }
        // トポロジーの概要に PC の詳細を追加
        $("#nsf-right dl").append('<dt><img src= img/plus.jpg>PC'+ i +'</dt><dd><p>IP: <span>'+ studyData[0].pc.ip[i] +'</span> /<span>'+ studyData[0].pc.sm[i] +'</span></p></dd>');
        // IP と SM の数値を追加
        $("#nsf-main img:last-child").data().ip = studyData[0].pc.ip[i];
        $("#nsf-main img:last-child").data().sm = studyData[0].pc.sm[i];
      }
      // Routerの設定
      for(var i = 0; i < studyData[0].router.node; i++) {
        // nsf-main に Router 画像を配置
        $("#nsf-main").append('<img src="img/router.png" class="context-menu-Router lanLink '+ studyData[0].router.lan[i] +'" alt="Router'+ i +'" style="position: absolute; top: '+ (studyHeight + studyData[0].router.style[i].top) +'px; left: '+ (studyWidth + studyData[0].router.style[i].left) +'px">');
        // トポロジーの概要に Router の詳細を追加
        $("#nsf-right dl").append('<dt><img src= img/plus.jpg>Router'+ i +'</dt><dd><p>IP-1: <span>'+ studyData[0].router.ip[i].first +'</span> /<span>'+ studyData[0].router.sm[i].first +'</span></p><p>IP-2: <span>'+ studyData[0].router.ip[i].second +'</span> /<span>'+ studyData[0].router.sm[i].second +'</span></p></dd>');
        // IP と SM の数値を追加
        $("#nsf-main img:last-child").data().ip_1 = studyData[0].router.ip[i].first;
        $("#nsf-main img:last-child").data().ip_2 = studyData[0].router.ip[i].second;
        $("#nsf-main img:last-child").data().sm_1 = studyData[0].router.sm[i].first;
        $("#nsf-main img:last-child").data().sm_2 = studyData[0].router.sm[i].second;
      }
      // dd要素(IPとSM)を隠す
      $("#nsf-right dd").css("display","none");
      // メインに線を引く
      NSF.lanArrClass = $("#nsf-main-canvas").attr("class").split(/\s?L_/);
      for(var i = 1; i < NSF.lanArrClass.length; i++) {
        NSF.fnLanDraw(NSF.lanArrClass[i]);
      }
    }
  }).fail(function(XMLHttpRequest, textStatus){
    console.log(XMLHttpRequest);
    console.log(textStatus);
    $("#nsf-console").append("<p>> 受信に失敗しました。</p>");
  }).always(function(){ NSF.fnAllGlayClose(); });
}

// 問題の送信が押されたとき (Update)
NSF.fnGlayStudyOutput = function() {
  var postData = {
    title: $("#sendStudyValue").val(),
    lanNode: NSF.lanNode,
    pc: {
      node: NSF.pcNode,
      name: "PC",
      style: [], lan:[], ip:[], sm:[], send:[], get:[], badgeStyle:[]
    },
    router: {
      node: NSF.ruNode,
      name: "Router",
      style: [], lan:[], ip:[], sm:[]
    }
  };
  var nsfMainTop  = $("#nsf-main").offset().top;
  var nsfMainLeft = $("#nsf-main").offset().left;

  $("#nsf-main .lanLink").each(function(e){
    var elthis = $(this);
    if ( elthis.attr("src") === "img/pc.png" ) {
      postData.pc.style.push({top: elthis.offset().top-nsfMainTop, left: elthis.offset().left-nsfMainLeft});
      postData.pc.lan.push(elthis.attr("class").match(/[es]P_\d{1,2}/)[0]);
      postData.pc.ip.push($("#nsf-right dt:contains("+ elthis.attr('alt') +") + dd p span:nth-of-type(1)").text());
      postData.pc.sm.push(Number($("#nsf-right dt:contains("+ elthis.attr('alt') +") + dd p span:nth-of-type(2)").text()));
      if (elthis.hasClass("send-node")) {
        postData.pc.send.push(true);
        postData.pc.get.push(false);
        postData.pc.badgeStyle.push({top: elthis.offset().top-nsfMainTop-15, left: elthis.offset().left-nsfMainLeft+42});
      }
      else if (elthis.hasClass("get-node")) {
        postData.pc.send.push(false);
        postData.pc.get.push(true);
        postData.pc.badgeStyle.push({top: elthis.offset().top-nsfMainTop-15, left: elthis.offset().left-nsfMainLeft+42});
      }
      else {
        postData.pc.send.push(false);
        postData.pc.get.push(false);
        postData.pc.badgeStyle.push({});

      }
    }
    else if ( $(this).attr("src") === "img/router.png") {
      postData.router.style.push({top: elthis.offset().top-nsfMainTop, left: elthis.offset().left-nsfMainLeft});
      postData.router.lan.push(elthis.attr("class").match(/([es]P_\d{1,2}\s*)+/)[0]);
      postData.router.ip.push({
        first: $("#nsf-right dt:contains("+ elthis.attr('alt') +") + dd p:nth-of-type(1) span:nth-of-type(1)").text(),
        second: $("#nsf-right dt:contains("+ elthis.attr('alt') +") + dd p:nth-of-type(2) span:nth-of-type(1)").text()
      });
      postData.router.sm.push({
        first: Number($("#nsf-right dt:contains("+ elthis.attr('alt') +") + dd p:nth-of-type(1) span:nth-of-type(2)").text()),
        second: Number($("#nsf-right dt:contains("+ elthis.attr('alt') +") + dd p:nth-of-type(2) span:nth-of-type(2)").text())
      });
    }
  });

  // 送信データの確認
  console.log("送信データ: "+ JSON.stringify(postData));

  // ajax通信でデータを渡す
  $.ajax({
    type: 'POST',
    dataType: 'json',
    url: 'php/studyInPut.php',
    data: 'data='+ JSON.stringify(postData),
  }).done(function(){
    $("#nsf-console").append("<p>> 機器情報を送信しました。IDは "+ $("#sendStudyValue").val() +" です。</p>");
  }).fail(function(XMLHttpRequest, textStatus){
    console.log(XMLHttpRequest);
    console.log(textStatus);
    $("#nsf-console").append("<p>> 送信に失敗しました。</p>");
  }).always(function(){ NSF.fnAllGlayClose(); });
}

// 閉じるボタンが押されたとき (Update)
NSF.fnAllGlayClose = function() {
  // 変数のリセット
  NSF.bGlayFladg = false;
  // イベントハンドラの削除
  $("#infoLeft").off('click', NSF.fnGlayInfoLeft);
  $("#infoRight").off('click', NSF.fnGlayInfoRight);
  $("#glayClose").off('click', NSF.fnAllGlayClose);
  $("#studyMenuButtonIn").off('click', NSF.fnGlayStudyInput);
  $("#studyMenuButtonOut").off('click', NSF.fnGlayStudyOutput);
  // GlayLayerを設定
  $("#glayLayer").css({'display':'none','height':0});
  $("#glayLayer").empty();
}


// nsf-main Fnction

// 画像を追加
NSF.fnMainDrop = function(ui, obj) {
  // 機種の判別
  if(ui.draggable.attr("src") === "img/pc.png") {
    NSF.dropNodeInt = NSF.pcNode;
    NSF.dropNodeName = "PC"+ NSF.pcNode;
    NSF.dropContextName = "context-menu-PC";
    NSF.pcNode++;
  }
  else if(ui.draggable.attr("src") === "img/router.png") {
    NSF.dropNodeInt = NSF.ruNode;
    NSF.dropNodeName = "Router"+ NSF.ruNode;
    NSF.dropContextName = "context-menu-Router";
    NSF.ruNode++;
  }
  // nsf-mainに画像を追加 (clssとstyleの設定の追加)
  $("#nsf-main").append(
    $("<img>").attr({
    src: ui.draggable.attr("src"),
    alt: NSF.dropNodeName,
    class: NSF.dropContextName,
    style: "position: absolute; top: "+ ui.offset.top +"px; left: "+ ui.offset.left +"px"
  }));
  // nsf-mainの画像にdraggableを付ける
  $("#nsf-main img:last-child").draggable({
    containment: 'parent',
    zIndex: 2,
    // ドラッグ中
    drag: function(){
      if($(this).prev().hasClass("get-node2") || $(this).prev().hasClass("send-node2")){
        $(this).prev().offset({
          top:  this.offsetTop - 15,
          left: this.offsetLeft + 42,
        });
        $(this).prev().css('zIndex', 3);
      }
    },
    // // ドラッグ終了
    stop: function(){
      if($(this).prev().hasClass("get-node2") || $(this).prev().hasClass("send-node2")){
        $(this).prev().css('zIndex', 1);
      }
    },
  });
  // LANが ONのとき画像を動かなくする
  if($("#lan").attr("src") === "img/lanCable_2.png") {
    var elMainImgLast = $("#nsf-main img:last-child");
    elMainImgLast.css("cursor", "crosshair");
    elMainImgLast.mouseup(function(e) { e.preventDefault(); });
    elMainImgLast.mousedown(function(e) { e.preventDefault(); });
    elMainImgLast.mouseenter(function(){
      NSF.lanFlag = true;
      $(this).addClass("lanOn");
      $(this).draggable("disable");
    }).mouseleave(function(){
      NSF.lanFlag = false;
      $(this).removeClass("lanOn");
      $(this).draggable("enable");
    });
  }
  // nsf-rightにトポロジを追加
  if(ui.draggable.attr("src") === "img/pc.png") {
    $(obj[0].lastChild).data().sm = 24;   // サブネットマスクの数値 (24)を挿入する
    $("#nsf-right dl").append("<dt><img src= img/plus.jpg>"+ ui.draggable.attr("alt") + + NSF.dropNodeInt +"</dt><dd><p>IP: <span></span> /<span>24</span></p></dd>");
  }
  else if(ui.draggable.attr("src") === "img/router.png") {
    $(obj[0].lastChild).data().sm_1 = 24; // サブネットマスクの数値 (24)を挿入する
    $(obj[0].lastChild).data().sm_2 = 24; // サブネットマスクの数値 (24)を挿入する
    $("#nsf-right dl").append("<dt><img src= img/plus.jpg>"+ ui.draggable.attr("alt") + + NSF.dropNodeInt +"</dt><dd><p>IP-1: <span></span> /<span>24</span></p><p>IP-2: <span></span> /<span>24</span></p></dd>");
  }
  // dd要素(IPとSM)を隠す
  $("#nsf-right dd:last").css("display","none");
}


// nsf-canvas Function

// マウスのボタンが押されたときに処理を実行する関数
NSF.fnLanDown = function(e) {
  // imgにマウスが乗っているとき
  if(NSF.lanFlag) {
    // PCに線が引かれているとき
    if($(e.target).attr("src") === "img/pc.png" && $(e.target).hasClass("lanLink")) {
      $("#nsf-console").append("<p>> PCにLANは1本しか引けません。</p>");
    }
    else {
      // canvasの追加
      NSF.addCanvas = $('<canvas width="' + NSF.canvasWidth + '" height="' + NSF.canvasHeight + '"></canvas>').prependTo('#nsf-main');
      NSF.lanFlagPoint = true;
      // lanLinkがある場合
      if($(this).children(".lanOn").hasClass("lanLink")) {
        NSF.lanFlaglink = true;
      }
      // Classの追加
      $(this).children(".lanOn").addClass("lanFrist lanLink sP_"+ NSF.lanNode);
      $('#nsf-main-canvas').addClass("L_"+ NSF.lanNode);
      // マウスを押した場所の座標
      NSF.points = [{x:e.pageX - this.offsetLeft, y:e.pageY - this.offsetTop}];
      // 関数 lanDragの呼び出し
      $("#nsf-main").on("mousemove", NSF.fnLanDrag);
    }
  }
}

// マウスが移動したときに処理を実行する関数
NSF.fnLanDrag = function(e) {
  NSF.addCtx = NSF.addCanvas.get(0).getContext('2d');
  NSF.points.push({x:e.pageX - this.offsetLeft, y:e.pageY - this.offsetTop});
  NSF.addCtx.clearRect(0, 0, NSF.canvasWidth, NSF.canvasHeight);
  NSF.addCtx.beginPath();
  // 線の色の変更
  if(!($(e.target).hasClass("lanFrist")) && $(e.target).hasClass("lanOn")) {
    NSF.addCtx.strokeStyle = '#2fb9fe';
  }
  else {
    NSF.addCtx.strokeStyle = '#fb9003';
  }
  NSF.addCtx.lineWidth = NSF.lanWidth;
  NSF.addCtx.moveTo(NSF.points[0].x, NSF.points[0].y);
  NSF.addCtx.lineTo(NSF.points[NSF.points.length - 1].x, NSF.points[NSF.points.length - 1].y);
  NSF.addCtx.stroke();
}

// マウスのボタンが離されたときに処理を実行する関数
NSF.fnLanUp = function(e) {
  if(NSF.lanFlagPoint) {
    NSF.lanFlagDelet = true;
    // マウスを押してドラッグしなかったとき || 画像の上に載ってないとき || 最初の画像のとき
    if(NSF.points.length === 1 || (NSF.lanFlag === false) || $(e.target).hasClass("lanFrist")) {
        if(NSF.lanFlaglink === true) {
          $(".sP_"+ NSF.lanNode).removeClass("sP_"+ NSF.lanNode);
        }
        else {
          $(".sP_"+ NSF.lanNode).removeClass("lanLink sP_"+ NSF.lanNode);
        }
        $("#nsf-main-canvas").removeClass("L_"+ NSF.lanNode);
        NSF.lanFlagDelet = false;
        NSF.lanNode--;
    }
    // PCにもう線が引かれているとき
    else if($(e.target).hasClass("lanLink") && $(e.target).attr("src") === "img/pc.png") {
      if(NSF.lanFlaglink === true) {
        $(".sP_"+ NSF.lanNode).removeClass("sP_"+ NSF.lanNode);
      }
      else {
        $(".sP_"+ NSF.lanNode).removeClass("lanLink sP_"+ NSF.lanNode);
      }
      $("#nsf-main-canvas").removeClass("L_"+ NSF.lanNode);
      $("#nsf-console").append("<p>> PCにLANは1本しか引けません。</p>");
      NSF.lanFlagDelet = false;
      NSF.lanNode--;
    }
    // 同じ場所に線を引かないようにする
    else {
      for(var i = 0; i < NSF.lanNode; i++) {
        if(($(".lanFrist").hasClass("sP_"+ i) && $(".lanOn").hasClass("eP_"+ i)) ||
           ($(".lanFrist").hasClass("eP_"+ i) && $(".lanOn").hasClass("sP_"+ i))) {
            $(".sP_"+ NSF.lanNode).removeClass("sP_"+ NSF.lanNode);
            $("#nsf-main-canvas").removeClass("L_"+ NSF.lanNode);
            $("#nsf-console").append("<p>> 同じ所にLANは引けません。</p>");
            NSF.lanFlagDelet = false;
            NSF.lanNode--;
            break;
        }
      }
    }

    // 画像の真ん中に線を持ってくる動作
    if(!($(e.target).hasClass("lanFrist")) && $(e.target).hasClass("lanOn") && NSF.lanFlagDelet) {
      NSF.lanArrWidth[NSF.lanNode] = NSF.lanWidth;
      $(".lanOn").addClass("lanLink eP_"+ NSF.lanNode);
      NSF.fnLanDraw(NSF.lanNode);
    }

    // 変数とフラグを設定
    NSF.lanNode++;
    NSF.points = [];
    NSF.lanFlaglink = false;
    NSF.lanFlagPoint = false;
    NSF.addCanvas.remove();
    // イベントハンドラの削除
    $("#nsf-main").off("mousemove", NSF.lanDrag);
    $("#nsf-main .ui-draggable").removeClass("lanFrist");
  }
}

// 線を引いてる途中 nsf-main以外でマウスを放した時
NSF.fnLanOutUp = function(e) {
  if(NSF.lanFlagPoint) {
    NSF.addCanvas.remove();
    if(!(NSF.lanFlaglink)) {
      $(".sP_"+ NSF.lanNode).removeClass("lanLink");
    }
    $("#nsf-main").off("mousemove", NSF.fnLanDrag);
    $("#nsf-main .ui-draggable").removeClass("lanFrist");
    $(".sP_"+ NSF.lanNode).removeClass("sP_"+ NSF.lanNode);
    $("#nsf-main-canvas").removeClass("L_"+ NSF.lanNode);
    // 変数とフラグをリセット
    NSF.points = [];
    NSF.lanFlaglink = false;
    NSF.lanFlagPoint = false;
  }
}

// マウスを押したとき (線を動かす動作)
NSF.fnLanMoveDown = function(e) {
  if($(e.target).hasClass("lanLink")) {
    NSF.elLanMoveThis = $(this);
    NSF.lanFlagMove = true;
    NSF.lanArrClass = $("#nsf-main-canvas").attr("class").split(/\s?L_/);
    NSF.elLanMoveThis.on("mousemove", NSF.fnLanMoveDrag);
  }
}

// ドラッグしている時 (線を動かす動作)
NSF.fnLanMoveDrag = function(e) {
  NSF.mainCtx.clearRect(0, 0, NSF.canvasWidth, NSF.canvasHeight);
  for(var i = 1; i < NSF.lanArrClass.length; i++) { NSF.fnLanDraw(NSF.lanArrClass[i]); }
}

// マウスを放した時 (線を動かす動作)
NSF.fnLanMoveUp = function(e) {
  if(NSF.lanFlagMove === true) {
    NSF.lanFlagMove = false;
    NSF.elLanMoveThis.off("mousemove", NSF.fnLanMoveDrag);
  }
}

// main以外でマウスを放した時 (線を動かす動作)
NSF.fnLanMoveOutUp = function(e) {
  if(NSF.lanFlagMove === true) {
    NSF.mainCtx.clearRect(0, 0, NSF.canvasWidth, NSF.canvasHeight);
    for(var i = 1; i < NSF.lanArrClass.length; i++) { NSF.fnLanDraw(NSF.lanArrClass[i]); }
    NSF.lanFlagMove = false;
    NSF.elLanMoveThis.off("mousemove", NSF.fnLanMoveDrag);
  }
}

// 線の描画関数 (バス型要改良)
NSF.fnLanDraw = function(i) {
  // スター型
  if($("input[name=lanRadio]:checked").val() === "radio-1") {
    NSF.mainCtx.beginPath();
    NSF.mainCtx.lineWidth = NSF.lanArrWidth[i];
    NSF.mainCtx.moveTo($(".sP_"+ i)[0].offsetLeft - NSF.mainCanvasWidth, $(".sP_"+ i)[0].offsetTop - NSF.mainCanvasHeight);
    NSF.mainCtx.lineTo($(".eP_"+ i)[0].offsetLeft - NSF.mainCanvasWidth, $(".eP_"+ i)[0].offsetTop - NSF.mainCanvasHeight);
    NSF.mainCtx.stroke();
  }
  // バス型
  else if($("input[name=lanRadio]:checked").val() === "radio-2") {
    NSF.mainCtx.beginPath();
    NSF.mainCtx.lineWidth = NSF.lanArrWidth[i];
    NSF.mainCtx.moveTo($(".sP_"+ i)[0].offsetLeft - NSF.mainCanvasWidth, $(".sP_"+ i)[0].offsetTop - NSF.mainCanvasHeight);
    NSF.mainCtx.lineTo($(".sP_"+ i)[0].offsetLeft - NSF.mainCanvasWidth, $(".sP_"+ i)[0].offsetTop - NSF.mainCanvasHeight + ($(".eP_"+ i)[0].offsetTop - NSF.mainCanvasHeight - $(".sP_"+ i)[0].offsetTop - NSF.mainCanvasHeight) / 2);
    NSF.mainCtx.lineTo($(".eP_"+ i)[0].offsetLeft - NSF.mainCanvasWidth, $(".sP_"+ i)[0].offsetTop - NSF.mainCanvasHeight + ($(".eP_"+ i)[0].offsetTop - NSF.mainCanvasHeight - $(".sP_"+ i)[0].offsetTop - NSF.mainCanvasHeight) / 2);
    NSF.mainCtx.lineTo($(".eP_"+ i)[0].offsetLeft - NSF.mainCanvasWidth, $(".eP_"+ i)[0].offsetTop - NSF.mainCanvasHeight);
    NSF.mainCtx.stroke();
  }
}


// nsf-etc Fnction

// contextMenuのcallback関数 (PC Router)
NSF.fnConfunc = function(key, opt) {
  // 削除を押した時の動作
  if(key === "del") {
    NSF.lanArrClass = $("#nsf-main-canvas").attr("class").split(/\s?L_/);
    NSF.mainCtx.clearRect(0, 0, NSF.canvasWidth, NSF.canvasHeight);
    for(var i = 1; i < NSF.lanArrClass.length; i++) {
      if(this.hasClass("sP_"+ NSF.lanArrClass[i]))　{
        $("#nsf-main img").removeClass("eP_"+ NSF.lanArrClass[i]);
        $("#nsf-main-canvas").removeClass("L_"+ NSF.lanArrClass[i]);
      }
      else if(this.hasClass("eP_"+ NSF.lanArrClass[i])) {
        $("#nsf-main img").removeClass("sP_"+ NSF.lanArrClass[i]);
        $("#nsf-main-canvas").removeClass("L_"+ NSF.lanArrClass[i]);
      }
      else {
        NSF.fnLanDraw(NSF.lanArrClass[i]);
      }
    }
    if($(this).hasClass("get-node") || $(this).hasClass("send-node")) {
      $(this).prev().remove();
    }
    $(this).remove();
    $("#nsf-main img:not([class*='P_'])").removeClass("lanLink");
    $("#nsf-right dt:contains('"+ opt.$trigger[0].alt +"'), #nsf-right dt:contains('"+ opt.$trigger[0].alt +"') + dd").remove();
    // lanLinkがないとき
    if(!($("#nsf-main .ui-draggable").hasClass("lanLink"))) {
      $("#nsf-main").off("mousedown", NSF.fnLanMoveDown);
      $("#nsf-main").off("mouseup", NSF.fnLanMoveUp);
      $("html").off("mouseup", NSF.fnLanMoveOutUp);
    }
  }
}






// イベントの定義


// window

// ブラウザをリサイズ
$(window).resize(function(){
  var loadWidth        = $('#nsf-main-canvas')[0].getBoundingClientRect().left - 35;
  var loadHeight       = $('#nsf-main-canvas')[0].getBoundingClientRect().top - 35;
  var calCanvasWidth   = loadWidth - NSF.mainCanvasWidth;
  var calCanvasHeight  = loadHeight - NSF.mainCanvasHeight;
  NSF.mainCanvasWidth  = loadWidth;
  NSF.mainCanvasHeight = loadHeight;
  $("#nsf-main img").each(function(i, val){
    $(val).offset({
      left:$(val).offset().left += calCanvasWidth,
      top:$(val).offset().top += calCanvasHeight
    });
  });
  $("#glayLayer").css({
    'top': $("#nsf-container").offset().top,
    'left': $("#nsf-container").offset().left,
  });
  // bGlayFlag
  if(NSF.bGlayFladg) {
    $("#glayLayer").css({
      'top':   $("#nsf-container").offset().top,
      'left':  $("#nsf-container").offset().left,
    });
  }
});

// GlayLayerの座標の指定 (New)
$("#glayLayer").css({
  'top': $("#nsf-container").offset().top,
  'left': $("#nsf-container").offset().left,
  'width':  $("#nsf-container").width() - 4,
});


// nsf-nav

// Dustをクリック
$("#dust").click(function(){ NSF.fnAllReset(); });

// Startをクリック (ajax) (要改良)
$("#connect-start").click(function(){
  if ( typeof NSFCS === "undefined" ) var NSFCS = {};
  NSFCS.postData          = '';   // 送るデータ
  NSFCS.arrGetNode        = 0;    // 受信のノード総数
  NSFCS.arrSendNode       = 0;    // 送信のノード総数
  NSFCS.sortTotal         = 0;    // sortした時の総数
  NSFCS.primaryTotal      = 0;    // Primaryの総数
  NSFCS.totalNodeNum      = 0;    // ノードの総数
  NSFCS.arrGetMatch       = [];   // 受信のIP配列
  NSFCS.arrSendMatch      = [];   // 送信のIP配列
  NSFCS.pcMask            = [];   // PCのサブネットマスク
  NSFCS.routerMask        = [];   // Routerのサブネットマスク
  NSFCS.arrSegPc          = [];   // PCのセグメント毎のIP配列
  NSFCS.arrSegPcSplit     = [];   // test
  NSFCS.arrSegRouter      = [];   // Routerのセグメント毎のIP配列
  NSFCS.arrSegRouterSplit = [];   // test
  NSFCS.arrSegAll         = [];   // 全ノードのセグメント毎のIP配列
  NSFCS.arrTypeAll        = [];   // 全ノードのセグメント毎のType配列
  NSFCS.arrPrimaryAll     = [];   // 全ノードのセグメント毎のPrimary配列
  NSFCS.arrBsmAll         = [];   // 全ノードのセグメント毎のサブネットマスク配列 ( 2進数)
  NSFCS.arrDsmAll         = [];   // 全ノードのセグメント毎のサブネットマスク配列 (10進数)
  NSFCS.arrSegAllSort     = [];   // 全ノードのセグメント毎のIP配列
  NSFCS.arrTypeAllSort    = [];   // 全ノードのセグメント毎のType配列
  NSFCS.arrPrimaryAllSort = [];   // 全ノードのセグメント毎のPrimary配列
  NSFCS.arrBsmAllSort     = [];   // 全ノードのセグメント毎のサブネットマスク配列 ( 2進数)
  NSFCS.arrDsmAllSort     = [];   // 全ノードのセグメント毎のサブネットマスク配列 (10進数)

  // Get-NodeかSend-Nodeを付いているかの確認とNSFCS.totalNodeNumを決定する。
  $("#nsf-main .lanLink").each(function(e){
    if($(this).hasClass("get-node")) {
      NSFCS.arrGetMatch[NSFCS.arrGetNode] = $("#nsf-right dt:contains('"+ $(this).attr("alt") +"') + dd p span:nth-of-type(1)").html();
      NSFCS.arrGetNode++;
    }
    else if($(this).hasClass("send-node")) {
      NSFCS.arrSendMatch[NSFCS.arrSendNode] = $("#nsf-right dt:contains('"+ $(this).attr("alt") +"') + dd p span:nth-of-type(1)").html();
      NSFCS.arrSendNode++;
    }
    NSFCS.totalNodeNum++;
  });

  // Routerのサブネットマスクを配列ごとに入れる
  $("#nsf-right dt:contains('Router') + dd p:nth-of-type(1) span:nth-of-type(2), #nsf-right dt:contains('Router') + dd p:nth-of-type(2) span:nth-of-type(2)").each(function(i, e){
    var input_sm = $(e).text();
    for(var j = 0; j < 4; j++) {
      if(NSFCS.routerMask[i] === undefined) {
        NSFCS.routerMask[i] = [];
      }
      NSFCS.routerMask[i][j] = "";
      for(var k = 0; k < 8; k++) {
        if(0 < input_sm) {
          NSFCS.routerMask[i][j] += "1";
          input_sm--;
        }
        else {
          NSFCS.routerMask[i][j] += "0";
        }
      }
      NSFCS.routerMask[i][j] = parseInt(NSFCS.routerMask[i][j], 2);
    }
  });

  // Routerの情報をサブネットマスク毎に入れる
  $("#nsf-right dt:contains('Router') + dd p:nth-of-type(1) span:nth-of-type(1), #nsf-right dt:contains('Router') + dd p:nth-of-type(2) span:nth-of-type(1)").each(function(i, e){
    var ip_split_match = "";
    NSFCS.arrSegRouter[i] = $(e).text();
    NSFCS.arrSegRouterSplit[i] = NSFCS.arrSegRouter[i].split(/\./);
    for(var j = 0; j < NSFCS.arrSegRouterSplit[i].length; j++) {
      ip_split_match += NSFCS.arrSegRouterSplit[i][j] & String(NSFCS.routerMask[i][j]);
    }
    for(var j = 0; j <= i; j++) {
      var sm_split_match = "";
      for(var k = 0; k < NSFCS.arrSegRouterSplit[j].length; k++) {
        sm_split_match += NSFCS.arrSegRouterSplit[j][k] & String(NSFCS.routerMask[j][k]);
      }
      if(ip_split_match === sm_split_match) {
        if(NSFCS.arrSegAll[j] === undefined) {
          NSFCS.arrSegAll[j]     = [];  // 1つ配列の箱を増やす
          NSFCS.arrTypeAll[j]    = [];
          NSFCS.arrPrimaryAll[j] = [];
          NSFCS.arrBsmAll[j]     = sm_split_match;
          NSFCS.arrDsmAll[j]     = "";
          for(var k = 0; k < 4; k++) {
            NSFCS.arrDsmAll[j] += String(NSFCS.routerMask[j][k]);
            if(k !== 3) {
              NSFCS.arrDsmAll[j] += ".";
            }
          }
        }
        var add_num = NSFCS.arrSegAll[j].length;
        NSFCS.arrSegAll[j][add_num]     = NSFCS.arrSegRouter[i];
        NSFCS.arrTypeAll[j][add_num]    = 1;
        NSFCS.arrPrimaryAll[j][add_num] = NSFCS.primaryTotal;
        break;
      }
    }
    // 今は奇数 (IPの入力フォームが 2つなの)で Primaryを1つ増やしている
    if(i % 2 !== 0) {
      NSFCS.primaryTotal++;
    }
  });

  // NSFCS.arrSegAllをソートする
  for(var i = 0; i <= NSFCS.arrSegAll.length; i++) {
    if(NSFCS.arrSegAll[i] !== undefined) {
      NSFCS.arrSegAllSort[NSFCS.sortTotal]     = NSFCS.arrSegAll[i];
      NSFCS.arrTypeAllSort[NSFCS.sortTotal]    = NSFCS.arrTypeAll[i];
      NSFCS.arrPrimaryAllSort[NSFCS.sortTotal] = NSFCS.arrPrimaryAll[i];
      NSFCS.arrBsmAllSort[NSFCS.sortTotal]     = NSFCS.arrBsmAll[i];
      NSFCS.arrDsmAllSort[NSFCS.sortTotal]     = NSFCS.arrDsmAll[i];
      NSFCS.sortTotal++;
    }
  }

  // PCのサブネットマスクを配列ごとに入れる
  $("#nsf-right dt:contains('PC') + dd p span:nth-of-type(2)").each(function(i, e){
    var input_sm = $(e).text();
    for(var j = 0; j < 4; j++) {
      if(NSFCS.pcMask[i] === undefined) {
        NSFCS.pcMask[i] = [];
      }
      NSFCS.pcMask[i][j] = "";
      for(var k = 0; k < 8; k++) {
        if(0 < input_sm) {
          NSFCS.pcMask[i][j] += "1";
          input_sm--;
        }
        else {
          NSFCS.pcMask[i][j] += "0";
        }
      }
      NSFCS.pcMask[i][j] = parseInt(NSFCS.pcMask[i][j], 2);
    }
  });

  // NSFCS.arrSegAllSortに PCの情報をサブネットマスク毎に入れる
  $("#nsf-right dt:contains('PC') + dd p span:nth-of-type(1)").each(function(i, e){
    var match_type         = true;
    var ip_split_match     = "";
    NSFCS.arrSegPc[i]      = $(e).text();   // IPアドレスを入れる
    NSFCS.arrSegPcSplit[i] = NSFCS.arrSegPc[i].split(/\./);
    for(var j = 0; j < NSFCS.arrSegPcSplit[i].length; j++) {
      ip_split_match += NSFCS.arrSegPcSplit[i][j] & String(NSFCS.pcMask[i][j]);
    }
    for(var j = 0; j < NSFCS.arrSegAllSort.length; j++) {
      var sm_split_match = NSFCS.arrBsmAllSort[j];
      if(ip_split_match === sm_split_match) {
        var add_num                     = NSFCS.arrSegAllSort[j].length;
        NSFCS.arrSegAllSort[j][add_num] = NSFCS.arrSegPc[i];  // PCのIPアドレスを入れる
        for(var k = 0; k < NSFCS.arrGetNode; k++) {
          if(NSFCS.arrSegPc[i] === NSFCS.arrGetMatch[k]) {
            NSFCS.arrTypeAllSort[j][add_num] = 3;
            match_type = false;
          }
        }
        for(var k = 0; k < NSFCS.arrSendNode; k++) {
          if(NSFCS.arrSegPc[i] === NSFCS.arrSendMatch[k]) {
            NSFCS.arrTypeAllSort[j][add_num] = 2;
            match_type = false;
          }
        }
        if(match_type) {
          NSFCS.arrTypeAllSort[j][add_num] = 0;
        }
        NSFCS.arrPrimaryAllSort[j][add_num] = NSFCS.primaryTotal; // PCのPrimaryを入れる
        NSFCS.primaryTotal++;
        break;
      }
    }
  });

  // 現在 lan の線に関係ないアルゴリズム
  if($("#nsf-main img").hasClass("lanLink")) {
    NSFCS.postData += '{';
    NSFCS.postData += '"total_node_num":'+ NSFCS.totalNodeNum +',';
    NSFCS.postData += '"total_seg_num":'+ NSFCS.arrSegAllSort.length +',';
    for(var i = 0; i < NSFCS.arrSegAllSort.length; i++) {
      NSFCS.postData += '"seg'+ (i+1) +'":[';
      NSFCS.postData += '{"node_num":'+ NSFCS.arrSegAllSort[i].length +',"seg":"'+ NSFCS.arrDsmAllSort[i] +'"},';
      for(var j = 0; j < NSFCS.arrSegAllSort[i].length; j++) {
        NSFCS.postData += '{';
        NSFCS.postData += '"primary":'+ NSFCS.arrPrimaryAllSort[i][j] +',';
        NSFCS.postData += '"type":'+ NSFCS.arrTypeAllSort[i][j] +',';
        NSFCS.postData += '"IP":"'+ NSFCS.arrSegAllSort[i][j] +'"';
        NSFCS.postData += '}';
        if(j !== NSFCS.arrSegAllSort[i].length -1) {
          NSFCS.postData += ',';
        }
      }
      NSFCS.postData += ']';
      if(i !== NSFCS.arrSegAllSort.length - 1) {
        NSFCS.postData += ',';
      }
    }
    NSFCS.postData += '}';
  }

  // NSFCS.postDataの最終確認
  $("#nsf-console").append("<p>> 送信開始･･･</p>");
  console.log("送信するデータ･･･"+ NSFCS.postData);

  // ajaxの動作 (使用する場合は以下のコメントアウトを外してください)
  // $.ajax({
  //   type: 'POST',
  //   dataType: 'json',
  //   url: '../../ns-allinone-3.25/ns-3.25/index.php',
  //   data: 'data=' + NSFCS.postData
  // }).done(function(data) {
  //   $("#nsf-console").append("<p>> 受信データ･･･"+ data +"</p>");
  // }).fail(function(XMLHttpRequest, textStatus) {
  //   $("#nsf-console").append("<p>> エラーが発生したので処理を終了します。</p>");
  // });
});

// Getをクリック
$("#get-packet").click(function(){ NSF.fnPacketChenge("get", "send", "reset"); });

// Sendをクリック
$("#send-packet").click(function(){ NSF.fnPacketChenge("send", "get", "reset"); });

// Resetをクリック
$("#reset-packet").click(function(){ NSF.fnPacketChenge("reset", "get", "send"); });

// Studyをクリック (Update)
$("#study").click(function(){
  // GlayLayerを表示
  NSF.fnGlayOpen();
  // 変数の定義
  var studyPostFlag = true;
  var studyDataSave;
  // ajax通信
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: 'php/studyOpen.php',
  }).done(function(studyData){
    studyDataSave = studyData;
  }).fail(function(XMLHttpRequest, textStatus){
    studyPostFlag = false;
    console.log(XMLHttpRequest);
    console.log(textStatus);
  }).always(function(){
    $("#glayLayer").append('<img src="img/batu.png" id="glayClose">');
    if (studyPostFlag && studyDataSave.length !== 0) {
      $("#glayLayer").append('<div id="glayStudyMenu">'+
        '<div id="studyMenuInput">'+
          '<div id="studyInputLeft"><p id="studyLeftTitle">'+ studyDataSave[0].title +'</p><img src="img/sample2.png" alt="Sample Img"><button id="studyMenuButtonIn">問題を受信</button></div>'+
          '<div id="studyInputRight"><ul></ul></div>'+
        '</div>'+
        '<div id="studyMenuOutput">'+
          '<div id="studyMenuForm">'+
            '<input id="sendStudyValue" placeholder="タイトルを入力して下さい">'+
            '<button id="studyMenuButtonOut">問題を送信</button>'+
          '</div>'+
        '</div>'
      );
      for(var i = 0; i < studyDataSave.length; i++){
        $("#studyInputRight ul").append('<li class="studyTitleInfo">'+ studyDataSave[i].title +'</li>');
      }
    } else {
      $("#glayLayer").append('<div id="glayStudyMenu">'+
        '<div id="studyMenuInput">'+
          '<div id="studyInputLeft"><p id="studyLeftTitle">受信に失敗しました</p></div>'+
          '<div id="studyInputRight"></div>'+
        '</div>'+
        '<div id="studyMenuOutput">'+
          '<div id="studyMenuForm">'+
            '<input id="sendStudyValue" placeholder="タイトルを入力して下さい">'+
            '<button id="studyMenuButtonOut">問題を送信</button>'+
          '</div>'+
        '</div>'
      );
    }
    // イベントハンドラの追加
    $("#glayClose").on('click', NSF.fnAllGlayClose);
    $("#studyMenuButtonIn").on('click', NSF.fnGlayStudyInput);
    $("#studyMenuButtonOut").on('click', NSF.fnGlayStudyOutput);
    $(".studyTitleInfo").on('click', NSF.fnGlayStudyTitleInfo);
  });
});

// Helpをクリック (Update)
$("#info").click(function(){
  // GlayLayerを表示
  NSF.fnGlayOpen();
  // 画像等の追加
  $("#glayLayer").append('<div id="slideGalley"><ul id="slideUl">'+
    '<li><img src="img/sample1.png"></li><li><img src="img/sample2.png"></li><li><img src="img/sample3.png"></li><li><img src="img/sample4.png"></li><li><img src="img/sample5.png"></li><li><img src="img/sample6.png"></li><li><img src="img/sample7.png"></li><li><img src="img/sample8.png"></li>'+
    '</ul></div>');
  $("#glayLayer").append('<img src="img/batu.png" id="glayClose">');
  $("#glayLayer").append('<img src="img/left.png" id="infoLeft">');
  $("#glayLayer").append('<img src="img/right.png" id="infoRight">');
  // イベントハンドラの追加
  $("#infoLeft").on('click', NSF.fnGlayInfoLeft);
  $("#infoRight").on('click', NSF.fnGlayInfoRight);
  $("#glayClose").on('click', NSF.fnAllGlayClose);
});

// Debugをクリック
$("#cui").click(function(){
  $("#nsf-console").append("<p>> デバックしました。</p>");
});


// nsf-left

// machineryをドラッグ
$(".machinery").draggable({
  helper: 'clone',  // 要素を複製する
  revert: true,     // ドラッグ終了時に要素に戻る
  zIndex: 2,
  // ドラッグ開始
  start: function(e, ui) { $(this).addClass('dragout'); },
  // ドラッグ終了
  stop: function(e, ui) { $(this).removeClass('dragout'); },
});

// lanをクリック
$("#lan").click(function(){
  var elHtml     = $("html");
  var elMain     = $("#nsf-main");
  var elMainDrag = $("#nsf-main .ui-draggable");
  // OFFのとき
  if($(this).attr("src") === "img/lanCable.png") {
    // 画像を ONに変更
    $(this).attr("src", "img/lanCable_2.png");
    // イベントハンドラーを付ける
    elMain.on("mousedown", NSF.fnLanDown);
    elMain.on("mouseup", NSF.fnLanUp);
    elHtml.on("mouseup", NSF.fnLanOutUp);
    // lanLinkがある時
    if(elMainDrag.hasClass("lanLink")) {
      elMain.off("mousedown", NSF.fnLanMoveDown);
      elMain.off("mouseup", NSF.fnLanMoveUp);
      elHtml.off("mouseup", NSF.fnLanMoveOutUp);
    }
    // カーソルの変更
    elMain.css("cursor", "crosshair");
    elMainDrag.css("cursor", "crosshair");
    // 画像のドラッグ防止
    elMainDrag.mouseup(function(e) { e.preventDefault(); });
    elMainDrag.mousedown(function(e) { e.preventDefault(); });
    // 画像にマウスが乗った時の動作
    elMainDrag.mouseenter(function(){
      // フラグの設定
      NSF.lanFlag = true;
      $(this).addClass("lanOn");
      $(this).draggable("disable");
    }).mouseleave(function(){
      // フラグの設定
      NSF.lanFlag = false;
      $(this).removeClass("lanOn");
      $(this).draggable("enable");
    });
  }
  // ONのとき
  else if($(this).attr("src") === "img/lanCable_2.png") {
    // 画像を OFFに変更
    $(this).attr("src", "img/lanCable.png");
    // イベントハンドラーの削除
    elMain.off("mousedown", NSF.fnLanDown);
    elMain.off("mouseup", NSF.fnLanUp);
    elHtml.off("mouseup", NSF.fnLanOutUp);
    elMainDrag.off("mouseenter").off("mouseleave");
    // カーソルの変更
    elMain.css("cursor", "auto");
    elMainDrag.css("cursor", "pointer");
    // lanLinkがある時
    if(elMainDrag.hasClass("lanLink")) {
      elMain.on("mousedown", NSF.fnLanMoveDown);
      elMain.on("mouseup", NSF.fnLanMoveUp);
      elHtml.on("mouseup", NSF.fnLanMoveOutUp);
    }
  }
});

// LANのスター型とバス型をクリック
$("input[name=lanRadio]").click(function(){
  NSF.lanArrClass = $("#nsf-main-canvas").attr("class").split(/\s?L_/);
  NSF.mainCtx.clearRect(0, 0, NSF.canvasWidth, NSF.canvasHeight);
  for(var i = 1; i < NSF.lanArrClass.length; i++) {
    NSF.fnLanDraw(NSF.lanArrClass[i]);
  }
});

// LANの帯域幅をクリック
$("input[name=lanRadio-2]").click(function(){
  // 100m
  if($("input[name=lanRadio-2]:checked").val() === "radio-3") {
    NSF.lanWidth = 2;
  }
  // 200m
  else if($("input[name=lanRadio-2]:checked").val() === "radio-4") {
    NSF.lanWidth = 5;
  }
  // 1G
  else if($("input[name=lanRadio-2]:checked").val() === "radio-5") {
    NSF.lanWidth = 9;
  }
});


// nsf-main

// nsf-mainにドロップ
$("#nsf-main").droppable({
  accept: '.machinery',
  tolerance: 'fit',
  // ドロップされたとき
  drop: function(e, ui){
    NSF.fnMainDrop(ui, $(this));
    NSF.mainDropFlg = false;
  },
  // ドロップを受け入れる Draggable 要素がドラッグを終了したとき
  deactivate: function(e, ui){
    ui.draggable.draggable({ revert: NSF.mainDropFlg });
    if(NSF.mainDropFlg === false) {
      NSF.mainDropFlg = true;
    }
  }
});

// nsf-mainの画像の上にいるとき
$("#nsf-main").on("mouseover", "img", function(e){
  $("#nsf-right dt:contains('"+ $(this).attr("alt") +"'), #nsf-right dt:contains('"+ $(this).attr("alt") +"') + dd").css({
    color: "#49cbf6",
  });
}).on("mouseout", "img", function(e){
  $("#nsf-right dt:contains('"+ $(this).attr("alt") +"'), #nsf-right dt:contains('"+ $(this).attr("alt") +"') + dd").css({
    color: "",
  });
});

// nsf-mainを右クリック
$("#nsf-main").contextmenu(function(e){
  if($("#lan").attr("src") === "img/lanCable_2.png") {
    // 画像に乗っているとき
    if(NSF.lanFlag) {
      // フラグの設定
      NSF.lanFlag = false;
      // Class(lanON)の削除
      $(e.target).removeClass("lanOn");
      // ドラッグ機能を有効
      $(e.target).draggable("enable");
    }
    // 画像を OFFに変更
    $("#lan").attr("src", "img/lanCable.png");
    // イベントハンドラーの削除
    $("#nsf-main").off("mousedown", NSF.fnLanDown);
    $("#nsf-main").off("mouseup", NSF.fnLanUp);
    $("html").off("mouseup", NSF.fnLanOutUp);
    $("#nsf-main .ui-draggable").off("mouseenter").off("mouseleave");
    // カーソルの変更
    $("#nsf-main").css("cursor", "auto");
    $("#nsf-main .ui-draggable").css("cursor", "pointer");
    // lanLinkがある時
    if($("#nsf-main .ui-draggable").hasClass("lanLink")) {
      $("#nsf-main").on("mousedown", NSF.fnLanMoveDown);
      $("#nsf-main").on("mouseup", NSF.fnLanMoveUp);
      $("html").on("mouseup", NSF.fnLanMoveOutUp);
    }
  }
});

// PCをクリック
$("#nsf-main").on("click", ".context-menu-PC", NSF.fnPacketAdd);


// nsf-right

// nsf-rightのimgをクリック
$("#nsf-right").on("click", "img", function(){
  var elthis = $(this);
  if(elthis.attr("src") === "img/plus.jpg") {
    elthis.attr("src", "img/minus.jpg");
    elthis.parent("dt").next().show();
  }
  else if(elthis.attr("src") === "img/minus.jpg") {
    elthis.attr("src", "img/plus.jpg");
    elthis.parent("dt").next().hide();
  }
});

// nsf-right-infoのimgをクリック
$("#nsf-right-info img").on("click", function(){
  if($(this).attr("src") === "img/open.png") {
    $("#nsf-right dd").show();
    $("#nsf-right dt img").attr("src", "img/minus.jpg");
  }
  if($(this).attr("src") === "img/close.png") {
    $("#nsf-right dd").hide();
    $("#nsf-right dt img").attr("src", "img/plus.jpg");
  }
});


// nsf-etc

// contextMenuのプラグインの設定 (PC)
$.contextMenu({
  selector: '.context-menu-PC',
  // 表示するメニュー
  items: NSF.conitems,
  //　イベントの動作
  events: NSF.conev,
  // コールバックの動作
  callback: NSF.fnConfunc,
});

// contextMenuのプラグインの設定 (Router)
$.contextMenu({
  selector: '.context-menu-Router',
  // 表示するメニュー
  items: NSF.conitems_2,
  //　イベントの動作
  events: NSF.conev_2,
  // コールバックの動作
  callback: NSF.fnConfunc,
});

});
