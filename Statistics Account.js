//Start of application.
console.log(account_username = "none");
function OnStart(){
    //Create or open a database called "appData".  
    db = app.OpenDatabase( "appData" );
    //Create table 'patrols' (if it doesn't exist).
    db.ExecuteSql("CREATE TABLE IF NOT EXISTS patrols(" +  
        "patrol_ID int not null, patrol_name varchar2(20) not null, start_time date not null, end_time date not null, city_start varchar2(20), " + 
        "city_end varchar2(20), P_or_S_start varchar2(30), P_or_S_end varchar2(30), country_start varchar2(30), country_end varchar2(30), " + 
        "vehicles_reported int not null, points int not null, constraint patrol_key PRIMARY KEY (time_seen, patrol_name))");
    //Create 'account_info' table (if it doesn't exist).
    db.ExecuteSql("CREATE TABLE IF NOT EXISTS account_info(username varchar2(20), home_country varchar2(30), " + 
        "gender char(1), icon int, constraint account_key PRIMARY KEY (username))");
    db.ExecuteSql("Insert into account_info (username) Values('null')");
    //App account creation check
	db.ExecuteSql("Select * From account_info;", [], anyInfo);
}
//New account or not?
function anyInfo(results){
    var item = results.rows.item(0);
    if(item.username == 'null'){
        newAccount();
    } else {
        account_username = item.username;
        appEntrance();
    }
}
function newAccount(){
    //New Account Creation Layout
    account_creation_layout = app.CreateLayout( "Linear", "VCenter,FillXY" );	
    account_creation_layout.SetBackground("Img/VPbkgdTitle.PNG");
    username_layout = app.CreateLayout("Linear", "Horizontal");
    account_creation_layout.AddChild(username_layout)
    usernameText = app.CreateText("Username:",0.35,0.06);
    usernameText.SetTextSize( 25 );
    usernameText.SetTextColor("#000000");
    usernameText.SetBackColor( "#009900" );
    username_layout.AddChild( usernameText );
    usernameEdit = app.CreateTextEdit( "", 0.60,0.06);
    usernameEdit.SetBackColor( "#333333" );
    username_layout.AddChild( usernameEdit );
    app.AddLayout(account_creation_layout);
}
function appEntrance(){
    //Entrance Layout
	entrance_layout = app.CreateLayout( "linear", "VCenter,FillXY" );	
    entrance_layout.SetBackground("Img/VPbkgdTitle.PNG");
    account_button = app.CreateButton("",0.4,0.1);
	//Patrol Button
	//Account Button
	entrance_layout.AddChild(account_button);
	//Entrance layout appearance
	app.AddLayout(entrance_layout);
    account_button.SetText(account_username);
}