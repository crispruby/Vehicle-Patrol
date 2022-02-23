//Start of application.
console.log(account_username = "none");
function OnStart(){
	//Entrance Layout
	entrance_layout = app.CreateLayout( "linear", "VCenter,FillXY" );	
    entrance_layout.SetBackground("Img/VPbkgdTitle.PNG");
    //Create or open a database called "appData".  
    db = app.OpenDatabase( "appData" );
    //Create table 'Identified vehicles'(if it doesn't exist).  
    db.ExecuteSql("CREATE TABLE IF NOT EXISTS reported_vehicles " +  
        "(time_seen date not null, maker varchar2(30), logo varchar2(30), model varchar2(30), shape varchar2(15), seen_P_or_S varchar2(30), "+
        "seen_country varchar(30), seen_area varchar(30), color1 varchar2(15), color2 varchar2(15), colourCombo varchar2(15), action varchar2(20),"+
        "company varchar2(40), P_or_S_LP varchar2(30), country_LP varchar(30), specialty varchar2(20), cargo varchar2(15), pull varchar2(15), "+
        "damage varchar2(15), emergency_type varchar2(15), constraint time_key PRIMARY KEY (time_seen))");
    //Create 'account_info' table (if it doesn't exist).
    db.ExecuteSql("CREATE TABLE IF NOT EXISTS account_info(username varchar2(20),password varchar2(15), home_country varchar2(30), " + 
        "birth_year int, gender char(1), constraint account_key PRIMARY KEY (username, password))");
    db.ExecuteSql("Insert into account_info (username, password) Values('null','null')");
    //App account creation
    //info_search();
	account_button = app.CreateButton("",0.4,0.1);
    db.ExecuteSql("Select * From account_info;", [], anyInfo);
	//Patrol Button
	//Account Button
	entrance_layout.AddChild(account_button);
	//Entrance layout appearance
	app.AddLayout(entrance_layout);
}
function anyInfo(results){
    account_username = "noll";
    var len = results.rows.length;  
    for(var i = 0; i < len; i++ ){
        var item = results.rows.item(i);
        account_username = item.username + ", " + item.password;   
    } 
    account_button.SetText(account_username);
}