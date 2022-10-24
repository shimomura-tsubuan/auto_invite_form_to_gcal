/***
初回にやること

1. カレンダーを作成
2. Googleフォームのカレンダータイトルと同様のタイトル名のGoogleフォームを作成(※メールアドレスの収集設定をGoogleフォーム側に設定すること)
3. 作成したGoogleフォームにこのリポジトリのスクリプトを貼り付けして、main関数を実行。
4. Googleフォーム側が自動生成されるのでそれを周知する。

※Invitationメールは届かないのでそれが必要なら別の作り込みが必要。
https://teratail.com/questions/161171
****/

function main(){
  var form = FormApp.getActiveForm();
  var title = form.getTitle();  // Googleフォームのタイトル（カレンダー予定名）を取得
  var info = get_my_schedule(title);    // カレンダー予定名から予定のIDと日取りを取得
  
  if(info[1]=="") {
    console.log("予定が見つかりませんでした。\nGoogleフォームのタイトルと、カレンダーの予定名が一致しているか確認してください。")
    return;
  }
  
  form.deleteItem(0)
  form.addMultipleChoiceItem()
    .setTitle("参加日を選択してください")
    .setChoiceValues(info[1])
    .setRequired(true)
  
  ScriptProperties.deleteAllProperties();
  ScriptProperties.setProperty("date-id", JSON.stringify(info[0]));

  // トリガー作成
  deleteTrigger();
  ScriptApp.newTrigger('onForm')
    .forForm(form)
    .onFormSubmit()
    .create();
}

function onForm(e) {
  var array = ScriptProperties.getProperty("date-id");
  array = JSON.parse(array);
  console.log("array: \n" + array);


  //入力者のemailを取得
  var email  = e.response.getRespondentEmail()
  
  //入力結果を取得(日付)
  var entry_day = e.response.getItemResponses()[0].getResponse();
  console.log("入力された日付: " + entry_day);
  
  //カレンダーに招待
  for(i in array){
    var date = array[i][0];
    var id = array[i][1];
    if ( entry_day == date ) {
      var calendarApp_event = CalendarApp.getDefaultCalendar().getEventById(id);
      var response = calendarApp_event.addGuest(email)
      console.log(response.getGuestList())
    }
  }
}



//予定取得用の関数
// var event_title_name = "kibela説明会"
function get_my_schedule(event_title_name) {
  var now = new Date();
  var twoWeeksFromNow = new Date(now.getTime() + (35 * 24 * 60 * 60 * 1000)); //5週間分の予定を取得
  var events = CalendarApp.getDefaultCalendar().getEvents(now, twoWeeksFromNow);
  

  var array = [];
  var date_array = [];
  for(var i=0;i<events.length;i++){
    var cal_title = events[i].getTitle()
    regexp = new RegExp((".*" + event_title_name + ".*"), 'g')
    if ( cal_title.match(regexp) ){
      var cal_start = events[i].getStartTime()
      var youbi = ['日','月','火','水','木','金','土'][cal_start.getDay()]
      var cal_atart_Md = Utilities.formatDate(cal_start, "Asia/Tokyo", "M/d");
      var cal_atart_HHmm = Utilities.formatDate(cal_start, "Asia/Tokyo", "HH:mm");
      var cal_end = events[i].getEndTime()
      var cal_end_HHmm = Utilities.formatDate(cal_end, "Asia/Tokyo", "HH:mm");
      var cal_icalid = events[i].getId()

      var date = cal_atart_Md + "(" + youbi + ") " + cal_atart_HHmm + "-" + cal_end_HHmm;
      var id = cal_icalid.toString()
      // Logger.log("---------")
      // Logger.log(cal_title.toString())   // schedule title
      // Logger.log(cal_icalid.toString()) // schedule id
      // Logger.log(date)  // date

      array.push([date, id]);
      date_array.push(date);
    }
  }
  return [array, date_array];
}

// Deletes all triggers in the current project.
function deleteTrigger(){
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}
