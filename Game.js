//Start of application.
function OnStart(){
    app.SetOrientation("Portrait");
    //Create or open a database called "appData".  
    db = app.OpenDatabase( "appData" );
    //db.Delete();
    //Create North America table (if it doesn't exist).
    db.ExecuteSql("CREATE TABLE IF NOT EXISTS northAmerica(" + 
        "countries varchar2(26), provinces varchar2(5),region varchar2(26), city varchar2(26))");
    //Create table (if it doesn't exist).
    db.ExecuteSql("CREATE TABLE IF NOT EXISTS patrols_count(" +  
        "patrol_name varchar2(20) not null, start_time date not null, end_time date not null, points int not null, vehicles int not null, "+
        "city_start varchar2(26), city_end varchar2(26),region_start varchar2(26),region_end varchar2(26), P_or_S_start varchar2(5), " +
        "P_or_S_end varchar2(5), country_start varchar2(26), country_end varchar2(26), constraint patrol_key PRIMARY KEY (patrol_name))");
    //Create table (if it doesn't exist).
    db.ExecuteSql("CREATE TABLE IF NOT EXISTS totals_info(totalPatrols int,totalPoints int,totalVehicles int,avgPoints int,avgVehicles int)");
    //Location Data
    db.ExecuteSql("Select distinct countries From northAmerica;", [], locationDataNA);
    //Entrance
	layout = app.CreateLayout( "linear", "VCenter,FillXY" );
	layout.SetBackground("img/VP.PNG");
    change = 5;
	app.AddLayout(layout);
    endTime = Date.now()+1000 * 1;
    entrance();
    intvl = setInterval(entrance, 300);
}
function entrance(){
    //Logos
    var tim = Date.now();
    var diff = Math.round((endTime - tim)/1000);
    if(diff < 1){
        diff = 0;
        clearInterval(intvl);
    }
    change = diff;
    if(change == 0){
        layout.SetBackColor("#000000");
	    //Tabs Menu
        threeTabs();
    }
}
function threeTabs(){
    three_tabs = app.CreateTabs( "Statistics,Past Patrols,Go Patrol", 1.0, 1.0, "VCenter" );
    //Statistics
    db.ExecuteSql("Select * From totals_info;", [], anyInfo);
    layoutStat = three_tabs.GetLayout("Statistics");
    statisticsPage();
    //App first-touch or update statistics info
    layoutStat.AddChild(score_layout);
    //Past Patrols
    layoutPastPatrols = three_tabs.GetLayout("Past Patrols");
    pastPatrolsPage();
    layoutPastPatrols.AddChild(pastPatrols_layout);
    //Go Patrol
    layoutGoPatrol = three_tabs.GetLayout("Go Patrol");
    goPatrolPage();
    layoutGoPatrol.AddChild(goPatrol_layout);
    layout.AddChild( three_tabs );
}
//Statistics Page
function anyInfo(results){
    //Check statistics in Database
    var len = results.rows.length;
    if(len == 0){
        db.ExecuteSql("Insert into totals_info Values(0,0,0,0,0);");
    }
    db.ExecuteSql("Select * From totals_info;", [], statistics_update);
}
function statistics_update(results){
    //Update Game's Statistics
    var item = results.rows.item(0);
    totalPatrols.SetText("Total Patrols: "+item.totalPatrols);
    totalPoints.SetText("Total Points: "+item.totalPoints);
    totalVehicles.SetText("Total Vehicles: "+item.totalVehicles);
    avgPoints.SetText("Avg Points/Patrol: "+item.avgPoints);
    avgVehicles.SetText("Avg Vehicles/Patrol: "+item.avgVehicles);
}
function statisticsPage(){
    //Statistics Layout
    score_layout = app.CreateLayout("Linear", "VCenter,FillXY");
    score_layout.SetBackColor("#3333ff");
    totalPatrols = app.CreateText("Total Patrols: 0",0.9,0.1,"Right");
    totalPatrols.SetTextSize( 30 );
    totalPatrols.SetTextColor("#ffff33");
    totalPatrols.SetBackColor("#ff0000");
    score_layout.AddChild(totalPatrols);
    totalPoints = app.CreateText("Total Points: 0",0.9,0.1,"Right");
    totalPoints.SetTextSize( 30 );
    totalPoints.SetTextColor("#ffff33");
    totalPoints.SetBackColor("#ff3333");
    score_layout.AddChild(totalPoints);
    totalVehicles = app.CreateText("Total Vehicles: 0",0.9,0.1,"Right");
    totalVehicles.SetTextSize( 30 );
    totalVehicles.SetTextColor("#ffff33");
    totalVehicles.SetBackColor("#ff5555");
    score_layout.AddChild(totalVehicles);
    avgPoints = app.CreateText("Avg Points/Patrol: 0",0.9,0.1,"Right");
    avgPoints.SetTextSize( 30 );
    avgPoints.SetTextColor("#ffff33");
    avgPoints.SetBackColor("#ff7777");
    score_layout.AddChild(avgPoints);
    avgVehicles = app.CreateText("Avg Vehicles/Patrol: 0",0.9,0.1,"Right");
    avgVehicles.SetTextSize( 30 );
    avgVehicles.SetTextColor("#ffff33");
    avgVehicles.SetBackColor("#ff9999");
    score_layout.AddChild(avgVehicles);
}
//Past Patrols Page
function pastPatrolsPage(){
    //Past Patrols Layout
    pastPatrols_layout = app.CreateLayout("Linear", "TopCenter,FillXY");
    search_layout = app.CreateLayout("Linear", "Horizontal,TopCenter");
    pastPatrols_layout.SetBackColor("#ff00ff");
    //Search:____________
    searcher = app.CreateText("Search:",0.25,0.079);
    searcher.SetMargins(0,-0.012);
    searcher.SetTextSize(25);
    searcher.SetTextColor("#dddd00");
    searcher.SetBackColor("#3333ff");
    search = app.CreateTextEdit("",0.75,0.071,"SingleLine");
    search.SetBackColor("#666666");
    search.SetTextColor("#ffffff");
    search.SetTextSize(20);
    search_layout.AddChild(searcher);
    search_layout.AddChild(search);
    //Patrol List
    patrolList = app.CreateList( "", 0.95, 0.83,"Right");
    patrolList.SetBackColor("#009900");
    search.SetOnChange(pastPatrols_Update);
    pastPatrols_Update();
    pastPatrols_layout.AddChild(search_layout);
    pastPatrols_layout.AddChild(patrolList);
}
function pastPatrols_Update(){
    nameLengthLimit(2);
    db.ExecuteSql("Select * From patrols_count;", [], patrolSearch_update);
}
function patrolSearch_update(results){
    var patrolListText = "";  
    var searchText = search.GetText();
    var textLength = searchText.length;
    var len = results.rows.length; 
    var patrols = 0;
    for(var i = 0; i < len; i++){
        var item = results.rows.item(i);
        var name = item.patrol_name;
        var test = name.substring(0,textLength);
        if(test == searchText){
            var timed = item.end_time;
            var timeHour = Number(timed.substring(16,18));
            if(timeHour > 12){
                timeHour = timeHour-12;
            }
            timed = timed.substring(4,16) + timeHour + "^c^" + timed.substring(19,21);
            //app.ShowPopup(timed);         //Code line, Used for tests and problems
            patrolListText += item.patrol_name + " | Area " + item.city_start + "-" + item.city_end + " | Date " + timed + 
            " | Vehicles " + item.vehicles + " | Points " + item.points;
            patrols++;
            if(i+1 < len){
                patrolListText += ",";
            }
        }
    }
    if(patrols == 0){
        patrolListText = "";
    }
    patrolList.SetList(patrolListText);
}
//Go Patrol Page
function goPatrolPage(){
    //Go Patrol Layout
    startRend = 0;
    goPatrol_layout = app.CreateLayout("Linear", "Vertical, TopCenter,FillXY");
    goPatrol_layout.SetBackColor("#ff0000");
    patrolTitle = app.CreateText("Patrol Name:",0.5,0.075);
    patrolTitle.SetTextSize(30);
    patrolTitle.SetTextColor("#000000");
    goPatrol_layout.AddChild(patrolTitle);
    patrolName = app.CreateTextEdit("",1,0.075,"SingleLine");
    patrolName.SetBackColor("#666666");
    patrolName.SetTextColor("#ffffff");
    patrolName.SetTextSize(20);
    patrolName.SetOnChange(PatrolNameLimit);
    goPatrol_layout.AddChild(patrolName);
    areaText = app.CreateText("Starting Area:", 0.6,0.08);
    areaText.SetTextSize(30);
    areaText.SetTextColor("#000000");
    goPatrol_layout.AddChild(areaText);
    continentTxt = app.CreateText("Continent", 0.6,0.08);
    continentTxt.SetTextSize(30);
    continentTxt.SetTextColor("#0000ff");
    goPatrol_layout.AddChild(continentTxt);
    continentBtns();
    country = app.CreateText("Country", 0.6,0.08);
    country.SetTextSize(30);
    country.SetTextColor("#0000ff");
    goPatrol_layout.AddChild(country);
    province = app.CreateText("Province/State", 0.6,0.08);
    province.SetTextSize(30);
    province.SetTextColor("#0000ff");
    goPatrol_layout.AddChild(province);
    city = app.CreateText("Town/City", 0.6,0.08);
    city.SetTextSize(30);
    city.SetTextColor("#0000ff");
    goPatrol_layout.AddChild(city);
    startPatrol = app.CreateButton("Start the Patrol", 0.8, 0.1, "FillX,Alum");
    startPatrol.SetTextSize(30);
    startPatrol.SetTextColor("#990099");
    startPatrol.SetOnTouchEx(beginPatrol);
    goPatrol_layout.AddChild(startPatrol);
}
function PatrolNameLimit(){
    nameLengthLimit(3); //Put Here to Solve a Bug
}
function nameLengthLimit(tabNum){
    //Lenght Limit on Patrol Name
    var testLength = "";
    if(tabNum == 2){
        testLength = search.GetText();
    }else if(tabNum == 3){
        testLength = patrolName.GetText();
    }
    var resultLength = testLength.length;
    if(resultLength == 20){
        app.ShowPopup("Limit of Characters!","Short");
    }else if(resultLength > 20 && tabNum == 2){
        search.SetText(testLength.substring(0,20));
        app.ShowPopup("Limit of Characters!","Short");
    }else if(resultLength > 20 && tabNum == 3){
        patrolName.SetText(testLength.substring(0,20));
        app.ShowPopup("Limit of Characters!","Short");
    }
}
function beginPatrol(){
    var shortString = patrolName.GetText();
    var narrowString = shortString.length;
    if(narrowString < 5){
        app.ShowPopup("Name requires least 5 characters!","Short");
    } else {
        if(startContinent == ""){
            app.ShowPopup("Select where you're starting the patrol!","Short");
        } else {
            //Data Holders
            vehicles_count = 0;
            points_count = 0;
            patrolNameResult = patrolName.GetText();
            startCountry = country.GetText();
            startProvince = province.GetText();
            startCity = city.GetText();
            startTime = new Date();
            day = startTime.getDate();
            month = startTime.getMonth();
            dayTime = startTime.getHours();
            if(dayTime == 0){
                dayTime = "12:"+startTime.getMinutes()+"am";
            } else if(dayTime < 12){
                dayTime = dayTime+":"+startTime.getMinutes()+"am";
            } else {
                dayTime = dayTime+":"+startTime.getMinutes()+"pm";
            }
            if(day < 10){
                day = "0" + day;
            }
            month++;
            if(month < 10){
                month = "0" + month;
            }
            timeDisplay = day+"/"+month+"/"+startTime.getFullYear()+" "+dayTime;
            detailVariables();
        }
    }
}
//Data Preparation
function detailVariables(){
    //Detail Holders
    makeDtl = "";
    modelDtl = "";
    shapeDtl = "";
    color1Dtl = "";
    color2Dtl = "";
    colorComboDtl = "Single Color";
    changeTabs();
}
function changeTabs(){
    patrol_tabs = app.CreateTabs("Color,Make,Model,Shape,Sum,Statistics", 1.0,1.0, "Vertical,TopCenter");
    //Color
    tabColor = patrol_tabs.GetLayout("Color");
    colorPage();
    tabColor.AddChild(colorLayout);
    //Make
    tabMake = patrol_tabs.GetLayout("Make");
    makePage();
    tabMake.AddChild(makeLayout);
    //Model
    tabModel = patrol_tabs.GetLayout("Model");
    modelPage();
    tabModel.AddChild(modelLayout);
    //Shape
    tabShape = patrol_tabs.GetLayout("Shape");
    shapePage();
    tabShape.AddChild(shapeLayout)
    //Summary
    tabSum = patrol_tabs.GetLayout("Sum");
    sumPage();
    tabSum.AddChild(sumLayout);
    //Statistics
    tabStat = patrol_tabs.GetLayout("Statistics");
    statPage();
    tabStat.AddChild(statLayout);
    //Change of Tabs
    layout.DestroyChild(three_tabs);
    layout.AddChild(patrol_tabs);
}
//Summary Page Function
function sumPage(){
    sumLayout = app.CreateLayout("Linear", "Vertical,TopCenter,FillXY");
    sumLayout.SetBackColor("#6600cc");
    sumTitle = app.CreateText("Vehicle Summary",0.9,0.07);
    sumTitle.SetTextSize(24);
    sumTitle.SetBackColor("#8800ff");
    sumTitle.SetTextColor("#ffffff");
    sumLayout.AddChild(sumTitle);
    IDLayout = app.CreateLayout("Linear", "Horizontal,TopCenter");
    textLayout = app.CreateLayout("Linear", "Vertical,TopCenter");
    makeText = app.CreateText("Make: ",0.7,0.08);
    makeText.SetTextSize(24);
    makeText.SetTextColor("#ffffff");
    modelText = app.CreateText("Model: ",0.7,0.08);
    modelText.SetTextSize(24);
    modelText.SetTextColor("#ffffff");
    shapeText = app.CreateText("Shape: ",0.7,0.08);
    shapeText.SetTextSize(24);
    shapeText.SetTextColor("#ffffff");
    logoLayout = app.CreateLayout("Linear", "Vertical,TopCenter");
    textLayout.AddChild(makeText);
    textLayout.AddChild(modelText);
    textLayout.AddChild(shapeText);
    IDLayout.AddChild(textLayout);
    IDLayout.AddChild(logoLayout);
    sumLayout.AddChild(IDLayout);
    colorText = app.CreateText("Color: ",0.9,0.08);
    colorText.SetTextSize(24);
    colorText.SetTextColor("#ffffff");
    comboText = app.CreateText("Combo: Single Color",0.9,0.08);
    comboText.SetTextSize(24);
    comboText.SetTextColor("#ffffff");
    reportBtn = app.CreateButton("Report Vehicle",0.8,0.1,"Alum");
    reportBtn.SetMargins(0,0.05)
    reportBtn.SetTextSize(24);
    reportBtn.SetOnTouchEx(reportVehicle);
    sumLayout.AddChild(colorText);
    sumLayout.AddChild(comboText);
    sumLayout.AddChild(reportBtn);
}
function reportVehicle(){
    var temporary_point_count = 0;
    if(makeDtl !== ""){
        temporary_point_count++;
        makeText.SetText("Make: ");
        makeDtl = "";
    }
    if(modelDtl !== ""){
        temporary_point_count++;
        modelText.SetText("Model: ");
        modelDtl = "";
    }
    if(shapeDtl !== ""){
        temporary_point_count++;
        shapeText.SetText("Shape: ");
        shapeDtl = "";
    }
    if(color1Dtl !== ""){
        temporary_point_count++;
        color1Dtl = "";
        color1.SetBackColor("#cccccc");
        color1.SetText("Select");
        color1.SetTextColor("#000000");
        
    }
    if(color2Dtl !== ""){
        temporary_point_count++;
        color2Dtl = "";
        color2.SetBackColor("#cccccc");
        color2.SetText("None");
        color2.SetTextColor("#000000");
    }
    colorText.SetText("Color: ");
    if(colorComboDtl !== "Single Color"){
        temporary_point_count++;
        app.ShowPopup("Test");
        colorComboDtl = "Single Color";
        comboDD.SetText("Single Color");
    }
    if(temporary_point_count > 0){
        vehicles_count++;
    }
    points_count += temporary_point_count;
    temporary_point_count = 0;
    app.ShowPopup(points_count);
    pointsText.SetText("Points: "+points_count);
    vehiclesText.SetText("Vehicles: "+vehicles_count);
}
//Statistics Page Function
function statPage(){
    statLayout = app.CreateLayout("Linear", "Vertical,TopCenter,FillXY");
    statLayout.SetBackColor("#6600cc");
    statTitle = app.CreateText("Patrol Statistics",0.9,0.07);
    statTitle.SetTextSize(24);
    statTitle.SetBackColor("#8800ff");
    statTitle.SetTextColor("#ffffff");
    statLayout.AddChild(statTitle);
    patrolText = app.CreateText("Patrol: "+patrolNameResult,0.9,0.07);
    patrolText.SetTextSize(24);
    patrolText.SetBackColor("#9933ff");
    patrolText.SetTextColor("#ffffff");
    statLayout.AddChild(patrolText);
    pointsText = app.CreateText("Points: 0",0.9,0.07);
    pointsText.SetTextSize(24);
    pointsText.SetTextColor("#ffffff");
    statLayout.AddChild(pointsText);
    vehiclesText = app.CreateText("Vehicles: 0",0.9,0.07);
    vehiclesText.SetTextSize(24);
    vehiclesText.SetTextColor("#ffffff");
    statLayout.AddChild(vehiclesText);
    startText = app.CreateText("Started: "+timeDisplay,0.9,0.07);
    startText.SetTextSize(24);
    startText.SetTextColor("#ffffff");
    statLayout.AddChild(startText);
    areaText = app.CreateText("Started in: Kelowna,BC,Canada",0.9,0.07);
    areaText.SetTextSize(24);
    areaText.SetTextColor("#ffffff");
    statLayout.AddChild(areaText);
    endBtn = app.CreateButton("End the Patrol",0.9,0.1,"Alum");
    endBtn.SetTextSize(24);
    endBtn.SetTextColor("#ffffff");
    endBtn.SetOnTouchEx(endPatrol);         //Can't Reuse it
    statLayout.AddChild(endBtn);
}
function endPatrol(){
    startRend = 1;
    endLayout = app.CreateLayout("Linear", "Vertical,TopCenter,FillXY");
    endLayout.SetBackColor("#ff0000");
    endTitle = app.CreateText("Finish the Patrol",0.9,0.07);
    endTitle.SetTextSize(24);
    endTitle.SetBackColor("#333333");
    endTitle.SetTextColor("#ffffff");
    endLayout.AddChild(endTitle);
    endAreaText = app.CreateText("Ending Area:", 0.6,0.1);
    endAreaText.SetTextSize(30);
    endAreaText.SetTextColor("#000000");
    endLayout.AddChild(endAreaText);
    endContinent = app.CreateText("Continent", 0.6,0.1);
    endContinent.SetTextSize(30);
    endContinent.SetTextColor("#0000ff");
    endLayout.AddChild(endContinent);
    continentBtns();
    endCountry = app.CreateText("Country", 0.6,0.1);
    endCountry.SetTextSize(30);
    endCountry.SetTextColor("#0000ff");
    endLayout.AddChild(endCountry);
    endProvince = app.CreateText("Province/State", 0.6,0.1);
    endProvince.SetTextSize(30);
    endProvince.SetTextColor("#0000ff");
    endLayout.AddChild(endProvince);
    endCity = app.CreateText("Town/City", 0.6,0.1);
    endCity.SetTextSize(30);
    endCity.SetTextColor("#0000ff");
    endLayout.AddChild(endCity);
    endPatrolBtn = app.CreateButton("Save the Patrol", 0.8, 0.1, "Alum");
    endPatrolBtn.SetTextSize(30);
    endPatrolBtn.SetTextColor("#990099");
    endPatrolBtn.SetOnTouchEx(savePatrol);
    endLayout.AddChild(endPatrolBtn);
    //Change of Tabs to Save Page
    layout.DestroyChild(patrol_tabs);
    layout.AddChild(endLayout);
}
function savePatrol(){
    if(endingContinent == ""){
        app.ShowPopup("Select where you're ending the patrol!","Short");
    } else {
        endTime = new Date();
        finishCountry = endCountry.GetText();
        finishProvince = endProvince.GetText();
        finishCity = endCity.GetText();
        nextInsert = "Insert into patrols_count Values('"+patrolNameResult+"','"+startTime+"','"+endTime+"',"+points_count+","+vehicles_count+
            //startCity+"','"+finishCity
            ",'"+"Kelowna','Kelowna"+"','"+startProvince+"','"+finishProvince+"','"+startCountry+"','"+finishCountry+"');";
        db.ExecuteSql(nextInsert);
        db.ExecuteSql("Select * From totals_info;", [], statistics_insert);
    }
}
function statistics_insert(results){
    var item = results.rows.item(0);
    allPatrols = item.totalPatrols + 1;
    allPoints = item.totalPoints + points_count;
    allVehicles = item.totalVehicles + vehicles_count;
    AVGpoints = Math.round(allPoints/allPatrols);
    AVGvehicles = Math.round(allVehicles/allPatrols);
    nextUpdate = "Update totals_info Set totalPatrols = "+allPatrols+", totalPoints = "+allPoints+", totalVehicles = "+allVehicles+
        ", avgPoints = "+AVGpoints.toFixed(2)+", avgVehicles = "+AVGvehicles.toFixed(0)+";";
    db.ExecuteSql(nextUpdate);
    layout.DestroyChild(endLayout);
    patrolName.SetText("");
    threeTabs();
}
//Continent buttons
function continentBtns(){
    northCNTNT = app.CreateLayout("Linear", "Horizontal,TopCenter");
    southCNTNT = app.CreateLayout("Linear", "Horizontal,TopCenter");
    NAMRC = app.CreateButton("North America", 0.35,0.06);
    ERP = app.CreateButton("Europe", 0.25, 0.06);
    ASIA = app.CreateButton("Asia", 0.2, 0.06);
    FRC = app.CreateButton("Africa", 0.2, 0.06);
    SAMRC = app.CreateButton("South America", 0.35, 0.06);
    CAMRC = app.CreateButton("Central America", 0.35, 0.06);
    OCNA = app.CreateButton("Oceania", 0.25, 0.06);
    NAMRC.SetOnTouchEx(NA);
    ERP.SetOnTouchEx(europe);
    ASIA.SetOnTouchEx(asia);
    FRC.SetOnTouchEx(africa);
    SAMRC.SetOnTouchEx(SA);
    OCNA.SetOnTouchEx(oceania);
    CAMRC.SetOnTouchEx(antartica);
    northCNTNT.AddChild(NAMRC);
    northCNTNT.AddChild(ERP);
    northCNTNT.AddChild(ASIA);
    northCNTNT.AddChild(FRC);
    southCNTNT.AddChild(SAMRC);
    southCNTNT.AddChild(CAMRC);
    southCNTNT.AddChild(OCNA);
    if(startRend == 0){
        goPatrol_layout.AddChild(northCNTNT);
        goPatrol_layout.AddChild(southCNTNT);
        startContinent = "";
    } else {
        endLayout.AddChild(northCNTNT);
        endLayout.AddChild(southCNTNT);
        endingContinent = "";
    }
}
function NA(){
    if(startRend == 0){
        continentTxt.SetText(NAMRC.GetText());
        startContinent = NAMRC.GetText();
    } else {
        endContinent.SetText(NAMRC.GetText());
        endingContinent = NAMRC.GetText();
    }
    db.ExecuteSql("Select distinct countries From northAmerica;", [], locationDataNA);
}
function europe(){
    if(startRend == 0){
        continentTxt.SetText(ERP.GetText());
        startContinent = ERP.GetText();
    } else {
        endContinent.SetText(ERP.GetText());
        endingContinent = ERP.GetText();
    }
}
function asia(){
    if(startRend == 0){
        continentTxt.SetText(ASIA.GetText());
        startContinent = ASIA.GetText();
    } else {
        endContinent.SetText(ASIA.GetText());
        endingContinent = ASIA.GetText();
    }
}
function africa(){
    if(startRend == 0){
        continentTxt.SetText(FRC.GetText());
        startContinent = FRC.GetText();
    } else {
        endContinent.SetText(FRC.GetText());
        endingContinent = FRC.GetText();
    }
}
function SA(){
    if(startRend == 0){
        continentTxt.SetText(SAMRC.GetText());
        startContinent = SAMRC.GetText();
    } else {
        endContinent.SetText(SAMRC.GetText());
        endingContinent = SAMRC.GetText();
    }
}
function oceania(){
    if(startRend == 0){
        continentTxt.SetText(OCNA.GetText());
        startContinent = OCNA.GetText();
    } else {
        endContinent.SetText(OCNA.GetText());
        endingContinent = OCNA.GetText();
    }
}
function antartica(){
    if(startRend == 0){
        continentTxt.SetText(CAMRC.GetText());
        startContinent = CAMRC.GetText();
    } else {
        endContinent.SetText(CAMRC.GetText());
        endingContinent = CAMRC.GetText();
    }
}
//Make Page Functions
function makePage(){
    makeLayout = app.CreateLayout("Linear", "Horizontal,TopCenter,FillXY");
    makeBtns();
    makeLayout.AddChild(makeLeftList);
    makeLayout.AddChild(makeCentreList);
    makeLayout.AddChild(makeRightSide);
}
function makeBtns(){
    var makeLeftBtns = "Acura,Alfa Romeo,Aston Martin,Audi,Bentley,BMW,Bugatti,Buick,Cadillac,Chevorlet,Chrysler,Citroen,Cobra,Dodge," + 
        "Ferrari,Fiat,Ford,Geely";
    makeLeftList = app.CreateList( makeLeftBtns, 0.33, 0.9, "OrangeButton" );
    makeLeftList.SetTextSize(16);
    makeLeftList.SetBackColor("#ffff00");
    makeLeftList.SetTextColor("#000000");
    makeLeftList.SetOnTouch(makeDetail);
    var makeCentreBtns = "General Motors,GMC,Honda,Hyundai,Infiniti,Jaguar,Jeep,Kia,Koenigsegg,Lamborghini,Land Rover,Lexus,Maserati,Mazda,"+
        "McLaren,Mercedes-Benz,Mini,Mitsubishi,Nissan";
    makeCentreList = app.CreateList( makeCentreBtns, 0.34, 0.9, "OrangeButton" );
    makeCentreList.SetTextSize(16);
    makeCentreList.SetBackColor( "#ffff77" );
    makeCentreList.SetTextColor("#000000");
    makeCentreList.SetOnTouch(makeDetail);
    var makeRightBtns = "Pagani,Peugeot,Pontiac,Porsche,Ram,Renault,Rolls Royce,Saab,Saturn,Subaru,Suzuki,Tata Motors,Tesla," + 
        "Toyota,Volvo,Volkswagen";
    makeRightSide = app.CreateLayout("Linear", "Vertical,TopCenter");
    makeRightList = app.CreateList( makeRightBtns, 0.33, 0.8, "OrangeButton" );
    makeRightList.SetTextSize(16);
    makeRightList.SetBackColor( "#ffffaa" );
    makeRightList.SetTextColor("#000000");
    makeRightList.SetOnTouch(makeDetail);
    makeReportBtn = app.CreateButton("Report\nVehicle", 0.33, 0.1);
    makeReportBtn.SetTextColor("#000000");
    makeReportBtn.SetBackColor("#c0c0c0");
    makeReportBtn.SetTextSize(20);
    makeReportBtn.SetOnTouchEx(reportVehicle);
    makeRightSide.AddChild(makeRightList);
    makeRightSide.AddChild(makeReportBtn);
}
function makeDetail(item){
    makeDtl = ""+item;
    makeText.SetText("Make: "+makeDtl);
    app.ShowPopup(makeDtl,"Short");
}
//Model Page Functions
function modelPage(){
    modelLayout = app.CreateLayout("Linear", "Horizontal,TopCenter,FillXY");
    modelBtns();
    modelLayout.AddChild(modelLeftList);
    modelLayout.AddChild(modelCentreList);
    modelLayout.AddChild(modelRightSide);
}
function modelBtns(){
    var modelLeftBtns = "Titan,Fit,Bravada";
    modelLeftList = app.CreateList( modelLeftBtns, 0.33, 0.9, "GreenButton" );
    modelLeftList.SetTextSize(16);
    modelLeftList.SetBackColor("#00ffff");
    modelLeftList.SetTextColor("#000000");
    modelLeftList.SetOnTouch(modelDetail);
    var modelCentreBtns = "F-150,Trailblazer,Mustang";
    modelCentreList = app.CreateList( modelCentreBtns, 0.34, 0.9, "GreenButton" );
    modelCentreList.SetTextSize(16);
    modelCentreList.SetBackColor( "#77ffff" );
    modelCentreList.SetTextColor("#000000");
    modelCentreList.SetOnTouch(modelDetail);
    modelRightSide = app.CreateLayout("Linear", "Vertical,TopCenter");
    var modelRightBtns = "Civic,Mustang";
    modelRightList = app.CreateList( modelRightBtns, 0.33, 0.8, "GreenButton" );
    modelRightList.SetTextSize(16);
    modelRightList.SetBackColor( "#aaffff" );
    modelRightList.SetTextColor("#000000");
    modelRightList.SetOnTouch(modelDetail);
    modelReportBtn = app.CreateButton("Report\nVehicle", 0.33, 0.1);
    modelReportBtn.SetTextColor("#000000");
    modelReportBtn.SetBackColor("#c0c0c0");
    modelReportBtn.SetTextSize(20);
    modelReportBtn.SetOnTouchEx(reportVehicle);
    modelRightSide.AddChild(modelRightList);
    modelRightSide.AddChild(modelReportBtn);
}
function modelDetail(item){
    modelDtl = ""+item;
    modelText.SetText("Model: "+modelDtl);
    app.ShowPopup(modelDtl,"Short");
}
//Shape Page Functions
function shapePage(){
    shapeLayout = app.CreateLayout("Linear", "Vertical,TopCenter,FillXY");
    shapeLayoutTypes = app.CreateLayout("Linear", "Horizontal,TopCenter");
    shapeCar = app.CreateButton("Car",0.15,0.1);
    shapeCar.SetOnTouchEx(carShapes);
    shapeCar.SetTextColor("#000000");
    shapeCar.SetBackColor("#ff6666");
    shapeLayoutTypes.AddChild(shapeCar);
    shapeVan = app.CreateButton("Van",0.15,0.1);
    shapeVan.SetOnTouchEx(vanShapes);
    shapeVan.SetTextColor("#000000");
    shapeVan.SetBackColor("#66ff66");
    shapeLayoutTypes.AddChild(shapeVan);
    shapeTruck = app.CreateButton("Truck",0.175,0.1);
    shapeTruck.SetOnTouchEx(truckShapes);
    shapeTruck.SetTextColor("#000000");
    shapeTruck.SetBackColor("#7777ff");
    shapeLayoutTypes.AddChild(shapeTruck);
    shapeBusRig = app.CreateButton("Bus/Rig+",0.225,0.1);
    shapeBusRig.SetOnTouchEx(busRigShapes);
    shapeBusRig.SetTextColor("#000000");
    shapeBusRig.SetBackColor("#ffff33");
    shapeLayoutTypes.AddChild(shapeBusRig);
    shapeConstruction = app.CreateButton("Construction",0.3,0.1);
    shapeConstruction.SetOnTouchEx(constructionShapes);
    shapeConstruction.SetTextColor("#000000");
    shapeConstruction.SetBackColor("#33ffff");
    shapeLayoutTypes.AddChild(shapeConstruction);
    shapeLayout.AddChild(shapeLayoutTypes);
    shapeLayoutLists = app.CreateLayout("Linear", "Horizontal,TopCenter");
    listNum = 1;
    startShapes();
    shapeRightSide = app.CreateLayout("Linear", "Vertical,TopCenter");
    shapeReportBtn = app.CreateButton("Report Vehicle", 0.5, 0.1);
    shapeReportBtn.SetTextColor("#000000");
    shapeReportBtn.SetBackColor("#c0c0c0");
    shapeReportBtn.SetTextSize(20);
    shapeReportBtn.SetOnTouchEx(reportVehicle);
    shapeRightSide.AddChild(shapeRightList);
    shapeRightSide.AddChild(shapeReportBtn);
    shapeLayoutLists.AddChild(shapeLeftList);
    shapeLayoutLists.AddChild(shapeRightSide);
    shapeLayout.AddChild(shapeLayoutLists);
}
function carShapes(){
    shapeLeftBtns = "Smart Car,Microcar,Subcompact Car,Compact Car,Medium Car,Full-Size Car,Small Luxury Car,Medium Luxury Car";
    shapeRightBtns = "Full Luxury Car,Grand Tourer,Sports Car,Super Car,Roadster,Station Wagon,Limousine";
    shapeBtns(1);
}
function vanShapes(){
    shapeLeftBtns = "Compact Minivan, Minivan, Mini SUV,Compact SUV,Medium SUV,Full-size SUV";
    shapeRightBtns = "Step Van,Utility Van,Delivery Van,Walk In Van,Large Walk In Van,Refrigerated Van";
    shapeBtns(2);
}
function truckShapes(){
    shapeLeftBtns = "Mini Pickup Truck,Medium Pickup Truck,Full Pickup Truck,Heavy Duty Pickup Truck,Bucket Truck,Rack Truck,Concrete Mixer";
    shapeRightBtns = "Stake Truck,Logs Truck,Tanker Truck,Dump Truck,Garbage Truck,Tow Truck,Flatbed Truck";
    shapeBtns(3);
}
function busRigShapes(){
    shapeLeftBtns = "Mini Bus,School Bus,City Transit Bus,Tour Bus,Motor Home,Fifth Wheel";
    shapeRightBtns = "High Rig,Medium Rig,Heavy Rig,Sleeper Rig,RV,Trailer";
    shapeBtns(4);
}
function constructionShapes(){
    shapeLeftBtns = "";
    shapeRightBtns = "";
    shapeBtns(5);
}
function startShapes(){
    shapeLeftBtns = "Smart Car,Microcar,Subcompact Car,Compact Car,Medium Car,Full-Size Car,Small Luxury Car,Medium Luxury Car";
    shapeRightBtns = "Full Luxury Car,Grand Tourer,Sports Car,Super Car,Roadster,Station Wagon,Limousine";
    shapeLeftList = app.CreateList( shapeLeftBtns, 0.5, 0.8, "OrangeButton" );
    shapeLeftList.SetOnTouch(shapeDetail);
    shapeRightList = app.CreateList( shapeRightBtns, 0.5, 0.7, "OrangeButton" );
    shapeRightList.SetOnTouch(shapeDetail);
    shapeLeftList.SetBackColor("#ccffff");
    shapeRightList.SetBackColor( "#ffffcc" );
}
function shapeBtns(btnNum){
    if(btnNum !== listNum){
        shapeLeftList.RemoveAll();
        shapeRightList.RemoveAll();
        shapeLeftList.SetList(shapeLeftBtns);
        shapeRightList.SetList(shapeRightBtns);
        listNum = btnNum;
    }
}
function shapeDetail(item){
    shapeDtl = ""+item;
    shapeText.SetText("Shape: "+shapeDtl);
    app.ShowPopup(shapeDtl,"Short");
}
//Color Page Function
function colorPage(){
    colorLayout = app.CreateLayout("Linear", "Vertical,TopCenter,FillXY");
    colorLayout.SetBackColor("#cccccc");
    twoColoursLayout = app.CreateLayout("Linear", "Horizontal,TopCenter");
    color1 = app.CreateText("Select",0.45,0.06);
    color2 = app.CreateText("None",0.45,0.06);
    color1.SetTextColor("#000000");
    color2.SetTextColor("#000000");
    color1.SetBackColor("#cccccc");
    color2.SetBackColor("#cccccc");
    color1.SetTextSize(20);
    color2.SetTextSize(20);
    color1.SetMargins(0.033,0.015);
    color2.SetMargins(0.033,0.015,0.033);
    twoColoursLayout.AddChild(color1);
    twoColoursLayout.AddChild(color2);
    titleColoursLayout = app.CreateLayout("Linear", "Horizontal,TopCenter");
    sideColor = 1;
    color11 = app.CreateButton("Main Colour",0.5,0.07);
    color11.SetBackColor("#cccccc");
    color11.SetTextColor("#000000");
    color11.SetTextSize(20);
    color22 = app.CreateButton("Second Colour",0.5,0.07);
    color22.SetBackColor("#444444");
    color22.SetTextColor("#ffffff");
    color22.SetTextSize(20);
    color11.SetOnTouchEx(mainColor);
    color22.SetOnTouchEx(secondColor);
    titleColoursLayout.AddChild(color11);
    titleColoursLayout.AddChild(color22);
    colorLayout.AddChild(titleColoursLayout);
    colorLayout.AddChild(twoColoursLayout);
    comboLayout = app.CreateLayout("Linear", "Horizontal,TopCenter");
    comboText = app.CreateText("Combo Type:",0.4,0.06);
    comboText.SetBackColor("#333333");
    comboText.SetTextColor("#ffffff");
    comboText.SetTextSize(20);
    comboText.SetMargins(0.033,0.015);
    comboDD = app.CreateText("Single Color",0.5,0.06);
    comboDD.SetBackColor("#999999");
    comboDD.SetTextColor("#000000");
    comboDD.SetTextSize(20);
    comboDD.SetMargins(0.033,0.015,0.033);
    comboLayout.AddChild(comboText);
    comboLayout.AddChild(comboDD);
    colorLayout.AddChild(comboLayout);
    colorBox();
    colorReportBtn = app.CreateButton("Report Vehicle", 0.5, 0.09);
    colorReportBtn.SetTextColor("#000000");
    colorReportBtn.SetBackColor("#aaaaaa");
    colorReportBtn.SetTextSize(20);
    colorReportBtn.SetMargins(0,0.02);
    colorReportBtn.SetOnTouchEx(reportVehicle);
    colorLayout.AddChild(colorReportBtn);
}
function mainColor(){
    if(sideColor == 2){
        sideColor = 1;
        color11.SetBackColor("#cccccc");
        color11.SetTextColor("#000000");
        color22.SetBackColor("#444444");
        color22.SetTextColor("#ffffff");
    }
}
function secondColor(){
    if(sideColor == 1){
        sideColor = 2;
        color22.SetBackColor("#cccccc");
        color22.SetTextColor("#000000");
        color11.SetBackColor("#444444");
        color11.SetTextColor("#ffffff");
    }
}
function colorBox(){
    function grayLine(){
        colors1 = app.CreateLayout("Linear", "Horizontal,TopCenter");
        blackBox = app.CreateButton("",0.25,0.06);
        blackBox.SetBackColor("#000000");
        blackBox.SetMargins(0.025,0.01);
        blackBox.SetOnTouchEx(blacko);
        colors1.AddChild(blackBox);
        greyBox = app.CreateButton("",0.25,0.06);
        greyBox.SetBackColor("#888888");
        greyBox.SetMargins(0.025,0.01);
        greyBox.SetOnTouchEx(greyo);
        colors1.AddChild(greyBox);
        whiteBox = app.CreateButton("",0.25,0.06);
        whiteBox.SetBackColor("#ffffff");
        whiteBox.SetMargins(0.025,0.01);
        whiteBox.SetOnTouchEx(whiteo);
        colors1.AddChild(whiteBox);
        colorLayout.AddChild(colors1);
    }
    function blueLine(){
        colors2 = app.CreateLayout("Linear", "Horizontal,TopCenter");
        blue1Box = app.CreateButton("",0.25,0.06);
        blue1Box.SetBackColor("#000066");
        blue1Box.SetMargins(0.025,0.01);
        blue1Box.SetOnTouchEx(blue1o);
        colors2.AddChild(blue1Box);
        blue2Box = app.CreateButton("",0.25,0.06);
        blue2Box.SetBackColor("#0000cc");
        blue2Box.SetMargins(0.025,0.01);
        blue2Box.SetOnTouchEx(blue2o);
        colors2.AddChild(blue2Box);
        blue3Box = app.CreateButton("",0.25,0.06);
        blue3Box.SetBackColor("#0000ff");
        blue3Box.SetMargins(0.025,0.01);
        blue3Box.SetOnTouchEx(blue3o);
        colors2.AddChild(blue3Box);
        colorLayout.AddChild(colors2);
    }
    function greenLine(){
        colors3 = app.CreateLayout("Linear", "Horizontal,TopCenter");
        green1Box = app.CreateButton("",0.25,0.06);
        green1Box.SetBackColor("#006600");
        green1Box.SetMargins(0.025,0.01);
        green1Box.SetOnTouchEx(green1o);
        colors3.AddChild(green1Box);
        green2Box = app.CreateButton("",0.25,0.06);
        green2Box.SetBackColor("#00cc00");
        green2Box.SetMargins(0.025,0.01);
        green2Box.SetOnTouchEx(green2o);
        colors3.AddChild(green2Box);
        green3Box = app.CreateButton("",0.25,0.06);
        green3Box.SetBackColor("#00ff00");
        green3Box.SetMargins(0.025,0.01);
        green3Box.SetOnTouchEx(green3o);
        colors3.AddChild(green3Box);
        colorLayout.AddChild(colors3);
    }
    function redLine(){
        colors4 = app.CreateLayout("Linear", "Horizontal,TopCenter");
        red1Box = app.CreateButton("",0.25,0.06);
        red1Box.SetBackColor("#880000");
        red1Box.SetMargins(0.025,0.01);
        red1Box.SetOnTouchEx(red1o);
        colors4.AddChild(red1Box);
        red2Box = app.CreateButton("",0.25,0.06);
        red2Box.SetBackColor("#cc0000");
        red2Box.SetMargins(0.025,0.01);
        red2Box.SetOnTouchEx(red2o);
        colors4.AddChild(red2Box);
        red3Box = app.CreateButton("",0.25,0.06);
        red3Box.SetBackColor("#ff0000");
        red3Box.SetMargins(0.025,0.01);
        red3Box.SetOnTouchEx(red3o);
        colors4.AddChild(red3Box);
        colorLayout.AddChild(colors4);
    }
    function orangeLine(){
        colors5 = app.CreateLayout("Linear", "Horizontal,TopCenter");
        brownBox = app.CreateButton("",0.25,0.06);
        brownBox.SetBackColor("#994422");
        brownBox.SetMargins(0.025,0.01);
        brownBox.SetOnTouchEx(browno);
        colors5.AddChild(brownBox);
        orangeBox = app.CreateButton("",0.25,0.06);
        orangeBox.SetBackColor("#ff7700");
        orangeBox.SetMargins(0.025,0.01);
        orangeBox.SetOnTouchEx(orangeo);
        colors5.AddChild(orangeBox);
        pinkBox = app.CreateButton("",0.25,0.06);
        pinkBox.SetBackColor("#ff9977");
        pinkBox.SetMargins(0.025,0.01);
        pinkBox.SetOnTouchEx(pinko);
        colors5.AddChild(pinkBox);
        colorLayout.AddChild(colors5);
    }
    function yellowLine(){
        colors6 = app.CreateLayout("Linear", "Horizontal,TopCenter");
        yellow1Box = app.CreateButton("",0.25,0.06);
        yellow1Box.SetBackColor("#cccc00");
        yellow1Box.SetMargins(0.025,0.01);
        yellow1Box.SetOnTouchEx(yellow1o);
        colors6.AddChild(yellow1Box);
        yellow2Box = app.CreateButton("",0.25,0.06);
        yellow2Box.SetBackColor("#dddd00");
        yellow2Box.SetMargins(0.025,0.01);
        yellow2Box.SetOnTouchEx(yellow2o);
        colors6.AddChild(yellow2Box);
        yellow3Box = app.CreateButton("",0.25,0.06);
        yellow3Box.SetBackColor("#ffff00");
        yellow3Box.SetMargins(0.025,0.01);
        yellow3Box.SetOnTouchEx(yellow3o);
        colors6.AddChild(yellow3Box);
        colorLayout.AddChild(colors6);
    }
    function purpleLine(){
        colors7 = app.CreateLayout("Linear", "Horizontal,TopCenter");
        purple1Box = app.CreateButton("",0.25,0.06);
        purple1Box.SetBackColor("#660066");
        purple1Box.SetMargins(0.025,0.01);
        purple1Box.SetOnTouchEx(purple1o);
        colors7.AddChild(purple1Box);
        purple2Box = app.CreateButton("",0.25,0.06);
        purple2Box.SetBackColor("#cc00cc");
        purple2Box.SetMargins(0.025,0.01);
        purple2Box.SetOnTouchEx(purple2o);
        colors7.AddChild(purple2Box);
        purple3Box = app.CreateButton("",0.25,0.06);
        purple3Box.SetBackColor("#ee00ee");
        purple3Box.SetMargins(0.025,0.01);
        purple3Box.SetOnTouchEx(purple3o);
        colors7.AddChild(purple3Box);
        colorLayout.AddChild(colors7);
    }
    function turqLine(){
        colors8 = app.CreateLayout("Linear", "Horizontal,TopCenter");
        turq1Box = app.CreateButton("",0.25,0.06);
        turq1Box.SetBackColor("#006666");
        turq1Box.SetMargins(0.025,0.01);
        turq1Box.SetOnTouchEx(turq1o);
        colors8.AddChild(turq1Box);
        turq2Box = app.CreateButton("",0.25,0.06);
        turq2Box.SetBackColor("#00cccc");
        turq2Box.SetMargins(0.025,0.01);
        turq2Box.SetOnTouchEx(turq2o);
        colors8.AddChild(turq2Box);
        turq3Box = app.CreateButton("",0.25,0.06);
        turq3Box.SetBackColor("#00ffff");
        turq3Box.SetMargins(0.025,0.01);
        turq3Box.SetOnTouchEx(turq3o);
        colors8.AddChild(turq3Box);
        colorLayout.AddChild(colors8);
    }
    grayLine();
    blueLine();
    greenLine();
    redLine();
    orangeLine();
    yellowLine();
    purpleLine();
    turqLine();
}
function blacko(){
    if(sideColor == 1){
        color1.SetBackColor("#000000");
        color1.SetTextColor("#ffffff");
        color1.SetText("Black");
        color1Dtl = "Black";
    }else if(sideColor == 2){
        color2.SetBackColor("#000000");
        color2.SetTextColor("#ffffff");
        color2.SetText("Black");
        color2Dtl = "Black";
    }
    colorDetails();
}
function greyo(){
    if(sideColor == 1){
        color1.SetBackColor("#888888");
        color1.SetTextColor("#ffffff");
        color1.SetText("Grey");
        color1Dtl = "Grey";
    }else if(sideColor == 2){
        color2.SetBackColor("#888888");
        color2.SetTextColor("#ffffff");
        color2.SetText("Grey");
        color2Dtl = "Grey";
    }
    colorDetails();
}
function whiteo(){
    if(sideColor == 1){
        color1.SetBackColor("#ffffff");
        color1.SetTextColor("#000000");
        color1.SetText("White");
        color1Dtl = "White";
    }else if(sideColor == 2){
        color2.SetBackColor("#ffffff");
        color2.SetTextColor("#000000");
        color2.SetText("White");
        color2Dtl = "White";
    }
    colorDetails();
}
function blue1o(){
    if(sideColor == 1){
        color1.SetBackColor("#000066");
        color1.SetTextColor("#ffffff");
        color1.SetText("Dark Blue");
        color1Dtl = "Dark Blue";
    }else if(sideColor == 2){
        color2.SetBackColor("#000066");
        color2.SetTextColor("#ffffff");
        color2.SetText("Dark Blue");
        color2Dtl = "Dark Blue";
    }
    colorDetails();
}
function blue2o(){
    if(sideColor == 1){
        color1.SetBackColor("#0000cc");
        color1.SetTextColor("#ffffff");
        color1.SetText("Blue");
        color1Dtl = "Blue";
    }else if(sideColor == 2){
        color2.SetBackColor("#0000cc");
        color2.SetTextColor("#ffffff");
        color2.SetText("Blue");
        color2Dtl = "Blue";
    }
    colorDetails();
}
function blue3o(){
    if(sideColor == 1){
        color1.SetBackColor("#0000ff");
        color1.SetTextColor("#ffffff");
        color1.SetText("Bright Blue");
        color1Dtl = "Bright Blue";
    }else if(sideColor == 2){
        color2.SetBackColor("#0000ff");
        color2.SetTextColor("#ffffff");
        color2.SetText("Bright Blue");
        color2Dtl = "Bright Blue";
    }
    colorDetails();
}
function green1o(){
    if(sideColor == 1){
        color1.SetBackColor("#006600");
        color1.SetTextColor("#ffffff");
        color1.SetText("Dark Green");
        color1Dtl = "Dark Green";
    }else if(sideColor == 2){
        color2.SetBackColor("#006600");
        color2.SetTextColor("#ffffff");
        color2.SetText("Dark Green");
        color2Dtl = "Dark Green";
    }
    colorDetails();
}
function green2o(){
    if(sideColor == 1){
        color1.SetBackColor("#00cc00");
        color1.SetTextColor("#000000");
        color1.SetText("Green");
        color1Dtl = "Green";
    }else if(sideColor == 2){
        color2.SetBackColor("#00cc00");
        color2.SetTextColor("#000000");
        color2.SetText("Green");
        color2Dtl = "Green";
    }
    colorDetails();
}
function green3o(){
    if(sideColor == 1){
        color1.SetBackColor("#00ff00");
        color1.SetTextColor("#000000");
        color1.SetText("Bright Green");
        color1Dtl = "Bright Green";
    }else if(sideColor == 2){
        color2.SetBackColor("#00ff00");
        color2.SetTextColor("#000000");
        color2.SetText("Bright Green");
        color2Dtl = "Bright Green";
    }
    colorDetails();
}
function red1o(){
    if(sideColor == 1){
        color1.SetBackColor("#880000");
        color1.SetTextColor("#ffffff");
        color1.SetText("Dark Red");
        color1Dtl = "Dark Red";
    }else if(sideColor == 2){
        color2.SetBackColor("#880000");
        color2.SetTextColor("#ffffff");
        color2.SetText("Dark Red");
        color2Dtl = "Dark Red";
    }
    colorDetails();
}
function red2o(){
    if(sideColor == 1){
        color1.SetBackColor("#cc0000");
        color1.SetTextColor("#ffffff");
        color1.SetText("Red");
        color1Dtl = "Red";
    }else if(sideColor == 2){
        color2.SetBackColor("#cc0000");
        color2.SetTextColor("#ffffff");
        color2.SetText("Red");
        color2Dtl = "Red";
    }
    colorDetails();
}
function red3o(){
    if(sideColor == 1){
        color1.SetBackColor("#ff0000");
        color1.SetTextColor("#000000");
        color1.SetText("Bright Red");
        color1Dtl = "Bright Red";
    }else if(sideColor == 2){
        color2.SetBackColor("#ff0000");
        color2.SetTextColor("#000000");
        color2.SetText("Bright Red");
        color2Dtl = "Bright Red";
    }
    colorDetails();
}
function browno(){
    if(sideColor == 1){
        color1.SetBackColor("#994422");
        color1.SetTextColor("#ffffff");
        color1.SetText("Brown");
        color1Dtl = "Brown";
    }else if(sideColor == 2){
        color2.SetBackColor("#994422");
        color2.SetTextColor("#ffffff");
        color2.SetText("Brown");
        color2Dtl = "Brown";
    }
    colorDetails();
}
function orangeo(){
    if(sideColor == 1){
        color1.SetBackColor("#ff7700");
        color1.SetTextColor("#000000");
        color1.SetText("Orange");
        color1Dtl = "Orange";
    }else if(sideColor == 2){
        color2.SetBackColor("#ff7700");
        color2.SetTextColor("#000000");
        color2.SetText("Orange");
        color2Dtl = "Orange";
    }
    colorDetails();
}
function pinko(){
    if(sideColor == 1){
        color1.SetBackColor("#ff9977");
        color1.SetTextColor("#000000");
        color1.SetText("Pink");
        color1Dtl = "Pink";
    }else if(sideColor == 2){
        color2.SetBackColor("#ff9977");
        color2.SetTextColor("#000000");
        color2.SetText("Pink");
        color2Dtl = "Pink";
    }
    colorDetails();
}
function yellow1o(){
    if(sideColor == 1){
        color1.SetBackColor("#cccc00");
        color1.SetTextColor("#000000");
        color1.SetText("Dark Yellow");
        color1Dtl = "Dark Yellow";
    }else if(sideColor == 2){
        color2.SetBackColor("#cccc00");
        color2.SetTextColor("#000000");
        color2.SetText("Dark Yellow");
        color2Dtl = "Dark Yellow";
    }
    colorDetails();
}
function yellow2o(){
    if(sideColor == 1){
        color1.SetBackColor("#dddd00");
        color1.SetTextColor("#000000");
        color1.SetText("Yellow");
        color1Dtl = "Yellow";
    }else if(sideColor == 2){
        color2.SetBackColor("#dddd00");
        color2.SetTextColor("#000000");
        color2.SetText("Yellow");
        color2Dtl = "Yellow";
    }
    colorDetails();
}
function yellow3o(){
    if(sideColor == 1){
        color1.SetBackColor("#ffff00");
        color1.SetTextColor("#000000");
        color1.SetText("Bright Yellow");
        color1Dtl = "Bright Yellow";
    }else if(sideColor == 2){
        color2.SetBackColor("#ffff00");
        color2.SetTextColor("#000000");
        color2.SetText("Bright Yellow");
        color2Dtl = "Bright Yellow";
    }
    colorDetails();
}
function purple1o(){
    if(sideColor == 1){
        color1.SetBackColor("#660066");
        color1.SetTextColor("#ffffff");
        color1.SetText("Dark Purple");
        color1Dtl = "Dark Purple";
    }else if(sideColor == 2){
        color2.SetBackColor("#660066");
        color2.SetTextColor("#ffffff");
        color2.SetText("Dark Purple");
        color2Dtl = "Dark Purple";
    }
    colorDetails();
}
function purple2o(){
    if(sideColor == 1){
        color1.SetBackColor("#cc00cc");
        color1.SetTextColor("#ffffff");
        color1.SetText("Purple");
        color1Dtl = "Purple";
    }else if(sideColor == 2){
        color2.SetBackColor("#cc00cc");
        color2.SetTextColor("#ffffff");
        color2.SetText("Purple");
        color2Dtl = "Purple";
    }
    colorDetails();
}
function purple3o(){
    if(sideColor == 1){
        color1.SetBackColor("#ee00ee");
        color1.SetTextColor("#000000");
        color1.SetText("Bright Purple");
        color1Dtl = "Bright Purple";
    }else if(sideColor == 2){
        color2.SetBackColor("#ee00ee");
        color2.SetTextColor("#000000");
        color2.SetText("Bright Purple");
        color2Dtl = "Bright Purple";
    }
    colorDetails();
}
function turq1o(){
    if(sideColor == 1){
        color1.SetBackColor("#006666");
        color1.SetTextColor("#ffffff");
        color1.SetText("Dark Turquoise");
        color1Dtl = "Dark Turquoise";
    }else if(sideColor == 2){
        color2.SetBackColor("#006666");
        color2.SetTextColor("#ffffff");
        color2.SetText("Dark Turquoise");
        color2Dtl = "Dark Turquoise";
    }
    colorDetails();
}
function turq2o(){
    if(sideColor == 1){
        color1.SetBackColor("#00cccc");
        color1.SetTextColor("#000000");
        color1.SetText("Turquoise");
        color1Dtl = "Turquoise";
    }else if(sideColor == 2){
        color2.SetBackColor("#00cccc");
        color2.SetTextColor("#000000");
        color2.SetText("Turquoise");
        color2Dtl = "Turquoise";
    }
    colorDetails();
}
function turq3o(){
    if(sideColor == 1){
        color1.SetBackColor("#00ffff");
        color1.SetTextColor("#000000");
        color1.SetText("Bright Turquoise");
        color1Dtl = "Bright Turquoise";
    }else if(sideColor == 2){
        color2.SetBackColor("#00ffff");
        color2.SetTextColor("#000000");
        color2.SetText("Bright Turquoise");
        color2Dtl = "Bright Turquoise";
    }
    colorDetails();
}
function colorDetails(){
    if(colorComboDtl !== "Single Color"){
        colorText.SetText("Colors: "+color1Dtl+", "+color2Dtl);
        comboText.SetText("Combo: "+colorComboDtl);
    }else{
        colorText.SetText("Color: "+color1Dtl);
    }
}
function colourComboDetail(item){
    colourComboDtl = ""+item;
    app.ShowPopup(ColourComboDtl,"Short");
}
//Locations Data
function locationDataNA(results){
    var len = results.rows.length;
    if(len == 0){
        function dataCanada(){
            //Alberta
            db.ExecuteSql("Insert into northAmerica Values('Canada','AB','Albertan Rockies','Banff'),('Canada','AB','Albertan Rockies','Canmore'),('Canada','AB','Albertan Rockies','Grande Cache'),('Canada','AB','Albertan Rockies','Hinton'),('Canada','AB','Albertan Rockies','Jasper'),('Canada','AB','Calgary Region','Airdrie'),('Canada','AB','Calgary Region','Black Diamond'),('Canada','AB','Calgary Region','Calgary'),('Canada','AB','Calgary Region','Chestermere'),('Canada','AB','Calgary Region','Cochrane'),('Canada','AB','Calgary Region','Crossfield'),('Canada','AB','Calgary Region','High River'),('Canada','AB','Calgary Region','Irricana'),('Canada','AB','Calgary Region','Okotoks'),('Canada','AB','Calgary Region','Turner Valley'),('Canada','AB','Central Alberta','Barrhead'),('Canada','AB','Central Alberta','Bashaw'),('Canada','AB','Central Alberta','Bentley'),('Canada','AB','Central Alberta','Blackfalds'),('Canada','AB','Central Alberta','Bon Accord'),('Canada','AB','Central Alberta','Bonnyville'),('Canada','AB','Central Alberta','Bowden'),('Canada','AB','Central Alberta','Camrose'),('Canada','AB','Central Alberta','Carstairs'),('Canada','AB','Central Alberta','Castor'),('Canada','AB','Central Alberta','Cold Lake'),('Canada','AB','Central Alberta','Coronation'),('Canada','AB','Central Alberta','Daysland'),('Canada','AB','Central Alberta','Didsbury'),('Canada','AB','Central Alberta','Drayton Valley'),('Canada','AB','Central Alberta','Eckville'),('Canada','AB','Central Alberta','Edson')," + 
                "('Canada','AB','Central Alberta','Elk Point'),('Canada','AB','Central Alberta','Hardisty'),('Canada','AB','Central Alberta','Hinton'),('Canada','AB','Central Alberta','Innisfail'),('Canada','AB','Central Alberta','Killam'),('Canada','AB','Central Alberta','Lacombe'),('Canada','AB','Central Alberta','Lamont'),('Canada','AB','Central Alberta','Lloydminster'),('Canada','AB','Central Alberta','Mayerthorpe'),('Canada','AB','Central Alberta','Millet'),('Canada','AB','Central Alberta','Mundare'),('Canada','AB','Central Alberta','Olds'),('Canada','AB','Central Alberta','Onoway'),('Canada','AB','Central Alberta','Penhold'),('Canada','AB','Central Alberta','Ponoka'),('Canada','AB','Central Alberta','Provost'),('Canada','AB','Central Alberta','Red Deer'),('Canada','AB','Central Alberta','Rimbey'),('Canada','AB','Central Alberta','Rocky Mountain House'),('Canada','AB','Central Alberta','Sedgewick'),('Canada','AB','Central Alberta','Smoky Lake'),('Canada','AB','Central Alberta','St. Paul'),('Canada','AB','Central Alberta','Stettler'),('Canada','AB','Central Alberta','Sundre'),('Canada','AB','Central Alberta','Sylvan Lake'),('Canada','AB','Central Alberta','Tofield'),('Canada','AB','Central Alberta','Two Hills'),('Canada','AB','Central Alberta','Vegreville'),('Canada','AB','Central Alberta','Vermillion'),('Canada','AB','Central Alberta','Viking'),('Canada','AB','Central Alberta','Wainwright'),('Canada','AB','Central Alberta','Westlock'),('Canada','AB','Central Alberta','Wetaskiwin'),('Canada','AB','Central Alberta','Whitecourt')," + 
                "('Canada','AB','Edmonton Capital Region','Beaumont'),('Canada','AB','Edmonton Capital Region','Bruderheim'),('Canada','AB','Edmonton Capital Region','Calmar'),('Canada','AB','Edmonton Capital Region','Devon'),('Canada','AB','Edmonton Capital Region','Edmonton'),('Canada','AB','Edmonton Capital Region','Fort Saskatchewan'),('Canada','AB','Edmonton Capital Region','Gibbons'),('Canada','AB','Edmonton Capital Region','Leduc'),('Canada','AB','Edmonton Capital Region','Legal'),('Canada','AB','Edmonton Capital Region','Morinville'),('Canada','AB','Edmonton Capital Region','Red Water'),('Canada','AB','Edmonton Capital Region','Spruce Grove'),('Canada','AB','Edmonton Capital Region','St. Albert'),('Canada','AB','Edmonton Capital Region','Stony Plain'),('Canada','AB','Edmonton Capital Region','Thorsby'),('Canada','AB','Northern Alberta','Athabasca'),('Canada','AB','Northern Alberta','Beaverlodge'),('Canada','AB','Northern Alberta','Fairview'),('Canada','AB','Northern Alberta','Falher'),('Canada','AB','Northern Alberta','Fox Creek'),('Canada','AB','Northern Alberta','Grande Prairie'),('Canada','AB','Northern Alberta','Grimshaw'),('Canada','AB','Northern Alberta','High Level'),('Canada','AB','Northern Alberta','High Prairie'),('Canada','AB','Northern Alberta','Manning'),('Canada','AB','Northern Alberta','McLennan'),('Canada','AB','Northern Alberta','Peace River'),('Canada','AB','Northern Alberta','Rainbow Lake'),('Canada','AB','Northern Alberta','Sexsmith'),('Canada','AB','Northern Alberta','Slave Lake')," + 
                "('Canada','AB','Northern Alberta','Spirit River'),('Canada','AB','Northern Alberta','Swan Hills'),('Canada','AB','Northern Alberta','Valleyview'),('Canada','AB','Northern Alberta','Wembley'),('Canada','AB','Southern Alberta','Bassano'),('Canada','AB','Southern Alberta','Bow Island'),('Canada','AB','Southern Alberta','Brooks'),('Canada','AB','Southern Alberta','Cardston'),('Canada','AB','Southern Alberta','Claresholm'),('Canada','AB','Southern Alberta','Coaldale'),('Canada','AB','Southern Alberta','Coalhurst'),('Canada','AB','Southern Alberta','Drumheller'),('Canada','AB','Southern Alberta','Fort Macleod'),('Canada','AB','Southern Alberta','Granum'),('Canada','AB','Southern Alberta','Hanna'),('Canada','AB','Southern Alberta','Lethbridge'),('Canada','AB','Southern Alberta','Magrath'),('Canada','AB','Southern Alberta','Medicine Hat'),('Canada','AB','Southern Alberta','Milk River'),('Canada','AB','Southern Alberta','Nanton'),('Canada','AB','Southern Alberta','Nobleford'),('Canada','AB','Southern Alberta','Oyen'),('Canada','AB','Southern Alberta','Picture Butte'),('Canada','AB','Southern Alberta','Pincher Creek'),('Canada','AB','Southern Alberta','Raymond'),('Canada','AB','Southern Alberta','Redcliff'),('Canada','AB','Southern Alberta','Stavely'),('Canada','AB','Southern Alberta','Strathmore'),('Canada','AB','Southern Alberta','Taber'),('Canada','AB','Southern Alberta','Three Hills'),('Canada','AB','Southern Alberta','Trochu'),('Canada','AB','Southern Alberta','Vauxhall'),('Canada','AB','Southern Alberta','Vulcan')");
            //British Columbia
            db.ExecuteSql("Insert into northAmerica Values('Canada','BC','Alberni-Clayoquot','Port Alberni'),('Canada','BC','Bulkley-Nechako','Burns Lake'),('Canada','BC','Bulkley-Nechako','Smithers'),('Canada','BC','Capital','Colwood'),('Canada','BC','Capital','Langley'),('Canada','BC','Capital','Sidney'),('Canada','BC','Capital','Victoria'),('Canada','BC','Capital','View Royals'),('Canada','BC','Cariboo','Quesnel'),('Canada','BC','Cariboo','Williams Lake'),('Canada','BC','Central Coast','Bella Coola'),('Canada','BC','Central Kootenay','Castlegar'),('Canada','BC','Central Kootenay','Creston'),('Canada','BC','Central Kootenay','Nelson'),('Canada','BC','Central Okanagan','Kelowna'),('Canada','BC','Central Okanagan','West Kelowna'),('Canada','BC','Columbia-Shuswap','Golden'),('Canada','BC','Columbia-Shuswap','Salmon Arm'),('Canada','BC','Columbia-Shuswap','Revelstoke'),('Canada','BC','Comox Valley','Comox'),('Canada','BC','Comox Valley','Courtenay'),('Canada','BC','Cowichan Valley','Duncan'),('Canada','BC','Cowichan Valley','Ladysmith'),('Canada','BC','Cowichan Valley','Lake Cowichan'),('Canada','BC','East Kootenay','Cranbrook'),('Canada','BC','East Kootenay','Fernie'),('Canada','BC','East Kootenay','Kimberley'),('Canada','BC','Fraser Valley','Abbotsford'),('Canada','BC','Fraser Valley','Chilliwack'),('Canada','BC','Fraser-Fort George','Prince George'),('Canada','BC','Kitimat-Stikine','Terrace'),('Canada','BC','Kootenay Boundary','Grand Forks'),('Canada','BC','Kootenay Boundary','Greenwood')," + 
                "('Canada','BC','Kootenay Boundary','Rossland'),('Canada','BC','Kootenay Boundary','Trail'),('Canada','BC','Metro Vancouver','Burnaby'),('Canada','BC','Metro Vancouver','Coquitlam'),('Canada','BC','Metro Vancouver','Delta'),('Canada','BC','Metro Vancouver','Maple Ridge'),('Canada','BC','Metro Vancouver','New Westminster'),('Canada','BC','Metro Vancouver','North Vancouver'),('Canada','BC','Metro Vancouver','Pitt Meadows'),('Canada','BC','Metro Vancouver','Port Coquitlam'),('Canada','BC','Metro Vancouver','Port Moody'),('Canada','BC','Metro Vancouver','Richmond'),('Canada','BC','Metro Vancouver','Surrey'),('Canada','BC','Metro Vancouver','Vancouver'),('Canada','BC','Metro Vancouver','White Rock'),('Canada','BC','Mount Waddington','Port McNeill'),('Canada','BC','Nanaimo','Nanaimo'),('Canada','BC','Nanaimo','Parksville'),('Canada','BC','Qualicum Beach'),('Canada','BC','North Okanagan','Armstrong'),('Canada','BC','North Okanagan','Coldstream'),('Canada','BC','North Okanagan','Enderby'),('Canada','BC','North Okanagan','Vernon'),('Canada','BC','Northern Rockies','Fort Nelson'),('Canada','BC','Okanagan-Similkameen','Oliver'),('Canada','BC','Okanagan-Similkameen','Osoyoos'),('Canada','BC','Okanagan-Similkameen','Penticton'),('Canada','BC','Okanagan-Similkameen','Princeton'),('Canada','BC','Peace River','Dawson Creek'),('Canada','BC','Peace River','Fort St. John'),('Canada','BC','Powell River','Powell River'),('Canada','BC','North Coast','Prince Rupert'),('Canada','BC','Squamish-Lillooet','Pemberton')," + 
                "('Canada','BC','Stikine Region',''),('Canada','BC','Strathcona','Campbell River'),('Canada','BC','Sunshine Coast','Gibsons'),('Canada','BC','Sunshine Coast','Sechelt'),('Canada','BC','Thompson-Nicola','Kamloops'),('Canada','BC','Thompson-Nicola','Merritt')");
            //Manitoba
            db.ExecuteSql("Insert into northAmerica Values('Canada','MB','Central Plains','Portage la Prairie'),('Canada','MB','Central Plains','Gladstone'),('Canada','MB','Central Plains','MacGregor'),('Canada','MB','Central Plains','Treherne'),('Canada','MB','Eastman','Beausejour'),('Canada','MB','Eastman','Lac du Bonnet'),('Canada','MB','Eastman','Niverville'),('Canada','MB','Eastman','Powerview-Pine Falls'),('Canada','MB','Eastman','Ste. Anne'),('Canada','MB','Eastman','Steinbach'),('Canada','MB','Interlake','Arborg'),('Canada','MB','Interlake','Selkirk'),('Canada','MB','Interlake','Winnipeg Beach'),('Canada','MB','Northern Manitoba','Churchill'),('Canada','MB','Northern Manitoba','Flin Flon'),('Canada','MB','Northern Manitoba','Gillam'),('Canada','MB','Northern Manitoba','Grand Rapids'),('Canada','MB','Northern Manitoba','Leaf Rapids'),('Canada','MB','Northern Manitoba','Lynn Lake'),('Canada','MB','Northern Manitoba','Snow Lake'),('Canada','MB','Northern Manitoba','The Pas'),('Canada','MB','Northern Manitoba','Thompson'),('Canada','MB','Parkland','Dauphin'),('Canada','MB','Parkland','Gilbert Plains'),('Canada','MB','Parkland','Grandview'),('Canada','MB','Parkland','Minitonas')," + 
                "('Canada','MB','Parkland','Pilot Mound'),('Canada','MB','Parkland','Plum Coulee'),('Canada','MB','Parkland','Roblin'),('Canada','MB','Parkland','Rossburn'),('Canada','MB','Parkland','Russell'),('Canada','MB','Parkland','Ste. Rose du Lac'),('Canada','MB','Parkland','Swan River'),('Canada','MB','Pembina Valley','Altona'),('Canada','MB','Pembina Valley','Carman'),('Canada','MB','Pembina Valley','Emerson'),('Canada','MB','Pembina Valley','Gretna'),('Canada','MB','Pembina Valley','Manitou'),('Canada','MB','Pembina Valley','Morden'),('Canada','MB','Pembina Valley','Morris'),('Canada','MB','Pembina Valley','Neepawa'),('Canada','MB','Pembina Valley','Winkler'),('Canada','MB','Westman','Boissevain'),('Canada','MB','Westman','Brandon'),('Canada','MB','Westman','Carberry'),('Canada','MB','Westman','Deloraine'),('Canada','MB','Westman','Hamiota'),('Canada','MB','Westman','Melita'),('Canada','MB','Westman','Minnedosa'),('Canada','MB','Westman','Rapid City'),('Canada','MB','Westman','Rivers'),('Canada','MB','Westman','Souris'),('Canada','MB','Westman','Virden'),('Canada','MB','Winnipeg Capital Region','Stonewall'),('Canada','MB','Winnipeg Capital Region','Teulon'),('Canada','MB','Winnipeg Capital Region','Winnipeg')");
            //New Brunswick
            db.ExecuteSql("Insert into northAmerica Values('Canada','NB','Albert','Riverview'),('Canada','NB','Carleton','Florenceville-Bristol'),('Canada','NB','Carleton','Hartland'),('Canada','NB','Carleton','Woodstock'),('Canada','NB','Charlotte','Saint Andrews'),('Canada','NB','Charlotte','St. George'),('Canada','NB','Charlotte','St. Stephen'),('Canada','NB','Gloucester','Bathurst'),('Canada','NB','Gloucester','Beresford'),('Canada','NB','Gloucester','Caraquet'),('Canada','NB','Gloucester','Lamèque'),('Canada','NB','Gloucester','Shippagan'),('Canada','NB','Kent','Bouctouche'),('Canada','NB','Kent','Richibucto'),('Canada','NB','Kings','Grand Bay-Westfield'),('Canada','NB','Kings','Hampton'),('Canada','NB','Kings','Quispamsis'),('Canada','NB','Kings','Rothesay'),('Canada','NB','Kings','Sussex')," + 
                "('Canada','NB','Madawaska','Edmundston'),('Canada','NB','Madawaska','Saint-Léonard'),('Canada','NB','Northumberland','Miramichi'),('Canada','NB','Queens','Minto'),('Canada','NB','Restigouche','Campbellton'),('Canada','NB','Restigouche','Dalhousie'),('Canada','NB','Restigouche','Saint-Quentin'),('Canada','NB','Saint John','Saint John'),('Canada','NB','Sunbury','Fredericton'),('Canada','NB','Sunbury','Oromocto'),('Canada','NB','Victoria','Grand Falls'),('Canada','NB','Westmorland','Dieppe'),('Canada','NB','Westmorland','Moncton'),('Canada','NB','Westmorland','Sackville'),('Canada','NB','Westmorland','Shediac'),('Canada','NB','York','Fredericton'),('Canada','NB','York','Nackawic')");
            //Newfoundland & Labrador
            db.ExecuteSql("Insert into northAmerica Values('Canada','NL','Avalon Peninsula','Adam\'s Cove'),('Canada','NL','Avalon Peninsula','Admirals Beach'),('Canada','NL','Avalon Peninsula','Aquaforte'),('Canada','NL','Avalon Peninsula','Arnold\'s Cove'),('Canada','NL','Avalon Peninsula','Avondale'),('Canada','NL','Avalon Peninsula','Bauline'),('Canada','NL','Avalon Peninsula','Bay Bulls'),('Canada','NL','Avalon Peninsula','Bay de Verde'),('Canada','NL','Avalon Peninsula','Bay Roberts'),('Canada','NL','Avalon Peninsula','Bishop\'s Cove'),('Canada','NL','Avalon Peninsula','Branch'),('Canada','NL','Avalon Peninsula','Brigus'),('Canada','NL','Avalon Peninsula','Bryant\'s Cove'),('Canada','NL','Avalon Peninsula','Cape Broyle'),('Canada','NL','Avalon Peninsula','Carbonear'),('Canada','NL','Avalon Peninsula','Chance Cove'),('Canada','NL','Avalon Peninsula','Chapel Arm'),('Canada','NL','Avalon Peninsula','Clarke\'s Beach'),('Canada','NL','Avalon Peninsula','Colinet'),('Canada','NL','Avalon Peninsula','Colliers'),('Canada','NL','Avalon Peninsula','Come By Chance'),('Canada','NL','Avalon Peninsula','Conception Bay South'),('Canada','NL','Avalon Peninsula','Conception Harbour'),('Canada','NL','Avalon Peninsula','Cupids'),('Canada','NL','Avalon Peninsula','Fermeuse'),('Canada','NL','Avalon Peninsula','Ferryland'),('Canada','NL','Avalon Peninsula','Flatrock'),('Canada','NL','Avalon Peninsula','Fortune Bay'),('Canada','NL','Avalon Peninsula','Fox Harbour'),('Canada','NL','Avalon Peninsula','Gaskiers-Point La Haye')," + 
                "('Canada','NL','Avalon Peninsula','Hant\'s Harbour'),('Canada','NL','Avalon Peninsula','Harbour Grace'),('Canada','NL','Avalon Peninsula','Harbour Main-Chapel\'s Cove'),('Canada','NL','Avalon Peninsula','Heart\'s Content'),('Canada','NL','Avalon Peninsula','Heart\'s Delight-Islington'),('Canada','NL','Avalon Peninsula','Heart\'s Desire'),('Canada','NL','Avalon Peninsula','Holyrood'),('Canada','NL','Avalon Peninsula','Logy Bay-Middle-Outer Cove'),('Canada','NL','Avalon Peninsula','Long Harbour-Mt Arlington'),('Canada','NL','Avalon Peninsula','Mount Carmel'),('Canada','NL','Avalon Peninsula','Mount Pearl'),('Canada','NL','Avalon Peninsula','New Perlican'),('Canada','NL','Avalon Peninsula','Norman\'s Cove-Long Cove'),('Canada','NL','Avalon Peninsula','North River'),('Canada','NL','Avalon Peninsula','Old Perlican'),('Canada','NL','Avalon Peninsula','Paradise'),('Canada','NL','Avalon Peninsula','Peter\'s River'),('Canada','NL','Avalon Peninsula','Petty Harbour-Maddox Cove'),('Canada','NL','Avalon Peninsula','Placentia'),('Canada','NL','Avalon Peninsula','Point Lance'),('Canada','NL','Avalon Peninsula','Port Kirwan'),('Canada','NL','Avalon Peninsula','Portugal Cove South'),('Canada','NL','Avalon Peninsula','Portugal Cove-St. Philip\'s'),('Canada','NL','Avalon Peninsula','Pouch Cove'),('Canada','NL','Avalon Peninsula','Renews-Cappahayden'),('Canada','NL','Avalon Peninsula','Riverhead'),('Canada','NL','Avalon Peninsula','Saint Bride\'s'),('Canada','NL','Avalon Peninsula','Saint Joseph\'s')," + 
                "('Canada','NL','Avalon Peninsula','Saint Mary\'s'),('Canada','NL','Avalon Peninsula','Salmon Cove'),('Canada','NL','Avalon Peninsula','South Brook'),('Canada','NL','Avalon Peninsula','South River'),('Canada','NL','Avalon Peninsula','Southern Harbour'),('Canada','NL','Avalon Peninsula','Spaniard\'s Bay'),('Canada','NL','Avalon Peninsula','St. John\'s'),('Canada','NL','Avalon Peninsula','St. Shott\'s'),('Canada','NL','Avalon Peninsula','Sunnyside'),('Canada','NL','Avalon Peninsula','Torbay'),('Canada','NL','Avalon Peninsula','Trepassey'),('Canada','NL','Avalon Peninsula','Upper Island Cove'),('Canada','NL','Avalon Peninsula','Victoria'),('Canada','NL','Avalon Peninsula','Wabana'),('Canada','NL','Avalon Peninsula','Whitbourne'),('Canada','NL','Avalon Peninsula','White Bay'),('Canada','NL','Avalon Peninsula','Whiteway'),('Canada','NL','Avalon Peninsula','Winterton'),('Canada','NL','Avalon Peninsula','Witless Bay'),('Canada','NL','Bonavista Peninsula','Bonavista'),('Canada','NL','Bonavista Peninsula','Centreville-W.-Trinity'),('Canada','NL','Bonavista Peninsula','Clarenville'),('Canada','NL','Bonavista Peninsula','Duntara'),('Canada','NL','Bonavista Peninsula','Elliston'),('Canada','NL','Bonavista Peninsula','Keels'),('Canada','NL','Bonavista Peninsula','King\'s Cove'),('Canada','NL','Bonavista Peninsula','Musgravetown'),('Canada','NL','Bonavista Peninsula','Port Blandford'),('Canada','NL','Bonavista Peninsula','Port Rexton'),('Canada','NL','Bonavista Peninsula','Trinity'),('Canada','NL','Bonavista Peninsula','Trinity Bay North')," + 
                "('Canada','NL','Burin Peninsula','Baine Harbour'),('Canada','NL','Burin Peninsula','Bay L\'Argent'),('Canada','NL','Burin Peninsula','Burin'),('Canada','NL','Burin Peninsula','Fortune'),('Canada','NL','Burin Peninsula','Fox Cove-Mortier'),('Canada','NL','Burin Peninsula','Frenchman\'s Cove'),('Canada','NL','Burin Peninsula','Garnish'),('Canada','NL','Burin Peninsula','Grand Bank'),('Canada','NL','Burin Peninsula','Lamaline'),('Canada','NL','Burin Peninsula','Lawn'),('Canada','NL','Burin Peninsula','Lewin\'s Cove'),('Canada','NL','Burin Peninsula','Little Bay East'),('Canada','NL','Burin Peninsula','Lord\'s Cove'),('Canada','NL','Burin Peninsula','Marystown'),('Canada','NL','Burin Peninsula','Parker\'s Cove'),('Canada','NL','Burin Peninsula','Point au Gaul'),('Canada','NL','Burin Peninsula','Point May'),('Canada','NL','Burin Peninsula','Red Harbour'),('Canada','NL','Burin Peninsula','Rushoon'),('Canada','NL','Burin Peninsula','Saint Lawrence'),('Canada','NL','Burin Peninsula','St. B.-Jacques Fontaine'),('Canada','NL','Burin Peninsula','Terrenceville'),('Canada','NL','Burin Peninsula','Winterland'),('Canada','NL','Great Northern Peninsula','Anchor Point'),('Canada','NL','Great Northern Peninsula','Bird Cove'),('Canada','NL','Great Northern Peninsula','Conche'),('Canada','NL','Great Northern Peninsula','Cook\'s Harbour'),('Canada','NL','Great Northern Peninsula','Cow Head'),('Canada','NL','Great Northern Peninsula','Daniel\'s Harbour'),('Canada','NL','Great Northern Peninsula','Englee')," + 
                "('Canada','NL','Great Northern Peninsula','Flower\'s Cove'),('Canada','NL','Great Northern Peninsula','Goose Cove East'),('Canada','NL','Great Northern Peninsula','Hampden'),('Canada','NL','Great Northern Peninsula','Hawke\'s Bay'),('Canada','NL','Great Northern Peninsula','Jackson\'s Arm'),('Canada','NL','Great Northern Peninsula','Main Brook'),('Canada','NL','Great Northern Peninsula','Parson\'s Pond'),('Canada','NL','Great Northern Peninsula','Port au Choix'),('Canada','NL','Great Northern Peninsula','Port Saunders'),('Canada','NL','Great Northern Peninsula','Raleigh'),('Canada','NL','Great Northern Peninsula','River of Ponds'),('Canada','NL','Great Northern Peninsula','Roddickton-Bide Arm'),('Canada','NL','Great Northern Peninsula','Saint Anthony'),('Canada','NL','Great Northern Peninsula','Saint Pauls'),('Canada','NL','Great Northern Peninsula','Sally\'s Cove'),('Canada','NL','Great Northern Peninsula','St. Lunaire-Griquet'),('Canada','NL','Labrador Coast','Cartwright'),('Canada','NL','Labrador Coast','Charlottetown'),('Canada','NL','Labrador Coast','Forteau'),('Canada','NL','Labrador Coast','Happy Valley-Goose Bay'),('Canada','NL','Labrador Coast','L\'Anse-au-Loup'),('Canada','NL','Labrador Coast','L\'Anse-au-Clair'),('Canada','NL','Labrador Coast','Mary\'s Harbour'),('Canada','NL','Labrador Coast','Pinware'),('Canada','NL','Labrador Coast','Port Hope Simpson'),('Canada','NL','Labrador Coast','Red Bay'),('Canada','NL','Labrador Coast','Saint Lewis'),('Canada','NL','Labrador Coast','West Saint Modeste')," + 
                "('Canada','NL','Labrador Nunatsiavut','Hopedale'),('Canada','NL','Labrador Nunatsiavut','Makkovik'),('Canada','NL','Labrador Nunatsiavut','Nain'),('Canada','NL','Labrador Nunatsiavut','North West River'),('Canada','NL','Labrador Nunatsiavut','Postville'),('Canada','NL','Labrador Nunatsiavut','Rigolet'),('Canada','NL','Labrador West','Labrador City'),('Canada','NL','Labrador West','Wabush'),('Canada','NL','NE Coast Newfoundland','Appleton'),('Canada','NL','NE Coast Newfoundland','Badger'),('Canada','NL','NE Coast Newfoundland','Baie Verte'),('Canada','NL','NE Coast Newfoundland','Baytona'),('Canada','NL','NE Coast Newfoundland','Beachside'),('Canada','NL','NE Coast Newfoundland','Bellburns'),('Canada','NL','NE Coast Newfoundland','Birchy Bay'),('Canada','NL','NE Coast Newfoundland','Bishop\'s Falls'),('Canada','NL','NE Coast Newfoundland','Botwood'),('Canada','NL','NE Coast Newfoundland','Brent\'s Cove'),('Canada','NL','NE Coast Newfoundland','Brighton'),('Canada','NL','NE Coast Newfoundland','Burlington'),('Canada','NL','NE Coast Newfoundland','Campbellton'),('Canada','NL','NE Coast Newfoundland','Carmanville'),('Canada','NL','NE Coast Newfoundland','Change Islands'),('Canada','NL','NE Coast Newfoundland','Clarenville'),('Canada','NL','NE Coast Newfoundland','Coachman\'s Cove'),('Canada','NL','NE Coast Newfoundland','Comfort Cove-Newstead'),('Canada','NL','NE Coast Newfoundland','Cottlesville'),('Canada','NL','NE Coast Newfoundland','Crow Head'),('Canada','NL','NE Coast Newfoundland','Dover')," + 
                "('Canada','NL','NE Coast Newfoundland','Eastport'),('Canada','NL','NE Coast Newfoundland','Embree'),('Canada','NL','NE Coast Newfoundland','Fleur de Lys'),('Canada','NL','NE Coast Newfoundland','Fogo Island'),('Canada','NL','NE Coast Newfoundland','Gambo'),('Canada','NL','NE Coast Newfoundland','Gander'),('Canada','NL','NE Coast Newfoundland','Glenwood'),('Canada','NL','NE Coast Newfoundland','Glovertown'),('Canada','NL','NE Coast Newfoundland','Grand Falls-Windsor'),('Canada','NL','NE Coast Newfoundland','Greenspond'),('Canada','NL','NE Coast Newfoundland','Happy Adventure'),('Canada','NL','NE Coast Newfoundland','Hare Bay'),('Canada','NL','NE Coast Newfoundland','Indian Bay'),('Canada','NL','NE Coast Newfoundland','King\'s Point'),('Canada','NL','NE Coast Newfoundland','LaScie'),('Canada','NL','NE Coast Newfoundland','Leading Tickles'),('Canada','NL','NE Coast Newfoundland','Lewisporte'),('Canada','NL','NE Coast Newfoundland','Little Bay'),('Canada','NL','NE Coast Newfoundland','Little Bay Islands'),('Canada','NL','NE Coast Newfoundland','Little Burnt Bay'),('Canada','NL','NE Coast Newfoundland','Lumsden'),('Canada','NL','NE Coast Newfoundland','Lushes Bight-Beaumont N.'),('Canada','NL','NE Coast Newfoundland','Middle Arm'),('Canada','NL','NE Coast Newfoundland','Miles Cove'),('Canada','NL','NE Coast Newfoundland','Millertown'),('Canada','NL','NE Coast Newfoundland','Ming\'s Bight'),('Canada','NL','NE Coast Newfoundland','Musgrave Harbour'),('Canada','NL','NE Coast Newfoundland','New-Wes-Valley')," + 
                "('Canada','NL','NE Coast Newfoundland','Nipper\'s Harbour'),('Canada','NL','NE Coast Newfoundland','Norris Arm'),('Canada','NL','NE Coast Newfoundland','Northern Arm'),('Canada','NL','NE Coast Newfoundland','Pacquet'),('Canada','NL','NE Coast Newfoundland','Peterview'),('Canada','NL','NE Coast Newfoundland','Pilley\'s Island'),('Canada','NL','NE Coast Newfoundland','Point Leamington'),('Canada','NL','NE Coast Newfoundland','Point of Bay'),('Canada','NL','NE Coast Newfoundland','Port Anson'),('Canada','NL','NE Coast Newfoundland','Roberts Arm'),('Canada','NL','NE Coast Newfoundland','Saint Brendan\'s'),('Canada','NL','NE Coast Newfoundland','Salvage'),('Canada','NL','NE Coast Newfoundland','Sandringham'),('Canada','NL','NE Coast Newfoundland','Sandy Cove'),('Canada','NL','NE Coast Newfoundland','Springdale'),('Canada','NL','NE Coast Newfoundland','Summerford'),('Canada','NL','NE Coast Newfoundland','Terra Nova'),('Canada','NL','NE Coast Newfoundland','Tilt Cove'),('Canada','NL','NE Coast Newfoundland','Traytown'),('Canada','NL','NE Coast Newfoundland','Triton'),('Canada','NL','NE Coast Newfoundland','Twillingate'),('Canada','NL','NE Coast Newfoundland','Westport'),('Canada','NL','NE Coast Newfoundland','Woodstock')," + 
                "('Canada','NL','South Coast Newfoundland','Belleoram'),('Canada','NL','South Coast Newfoundland','Burgeo'),('Canada','NL','South Coast Newfoundland','Burnt Islands'),('Canada','NL','South Coast Newfoundland','Channel-Port aux Basques'),('Canada','NL','South Coast Newfoundland','English Harbour East'),('Canada','NL','South Coast Newfoundland','Gaultois'),('Canada','NL','South Coast Newfoundland','Grand Le Pierre'),('Canada','NL','South Coast Newfoundland','Harbour Breton'),('Canada','NL','South Coast Newfoundland','Hermitage-Sandyville'),('Canada','NL','South Coast Newfoundland','Isle aux Morts'),('Canada','NL','South Coast Newfoundland','Head of Bay d\'Espoir'),('Canada','NL','South Coast Newfoundland','Morrisville'),('Canada','NL','South Coast Newfoundland','Pool\'s Cove'),('Canada','NL','South Coast Newfoundland','Ramea'),('Canada','NL','South Coast Newfoundland','Recontre East'),('Canada','NL','South Coast Newfoundland','Rose Blanche-Harbour Cou'),('Canada','NL','South Coast Newfoundland','Saint Alban\'s'),('Canada','NL','South Coast Newfoundland','St. Jacques-Coomb\'s Cove'),('Canada','NL','West Coast Newfoundland','Buchans'),('Canada','NL','West Coast Newfoundland','Cape St. George'),('Canada','NL','West Coast Newfoundland','Cormack'),('Canada','NL','West Coast Newfoundland','Corner Brook'),('Canada','NL','West Coast Newfoundland','Cox\'s Cove'),('Canada','NL','West Coast Newfoundland','Deer Lake'),('Canada','NL','West Coast Newfoundland','Gallants'),('Canada','NL','West Coast Newfoundland','Gillams')," + 
                "('Canada','NL','West Coast Newfoundland','Glenburnie-Birchy Head'),('Canada','NL','West Coast Newfoundland','Howley'),('Canada','NL','West Coast Newfoundland','Hughes Brook'),('Canada','NL','West Coast Newfoundland','Humber Arm South'),('Canada','NL','West Coast Newfoundland','Irishtown-Summerside'),('Canada','NL','West Coast Newfoundland','Kippens'),('Canada','NL','West Coast Newfoundland','Lark Harbour'),('Canada','NL','West Coast Newfoundland','Lourdes'),('Canada','NL','West Coast Newfoundland','Massey Drive'),('Canada','NL','West Coast Newfoundland','McIvers'),('Canada','NL','West Coast Newfoundland','Meadows'),('Canada','NL','West Coast Newfoundland','Mount Moriah'),('Canada','NL','West Coast Newfoundland','Norris Point'),('Canada','NL','West Coast Newfoundland','Pasadena'),('Canada','NL','West Coast Newfoundland','Port Aguathuna-Felix Cove'),('Canada','NL','West Coast Newfoundland','Port au Port East'),('Canada','NL','West Coast Newfoundland','Reidville'),('Canada','NL','West Coast Newfoundland','Rocky Harbour'),('Canada','NL','West Coast Newfoundland','Saint George\'s'),('Canada','NL','West Coast Newfoundland','Steady Brook'),('Canada','NL','West Coast Newfoundland','Stephenville'),('Canada','NL','West Coast Newfoundland','Stephenville Crossing'),('Canada','NL','West Coast Newfoundland','Trout River'),('Canada','NL','West Coast Newfoundland','Woody Point'),('Canada','NL','West Coast Newfoundland','York Harbour')");
            //Northwest Territories
            db.ExecuteSql("Insert into northAmerica Values('Canada','NWT','Dehcho','Fort Simpson'),('Canada','NWT','Inuvik','Inuvik'),('Canada','NWT','North Slave','Behchoko'),('Canada','NWT','North Slave','Yellowknife'),('Canada','NWT','Sahtu','Norman Wells'),('Canada','NWT','South Slave','Fort Smith'),('Canada','NWT','South Slave','Hay River')");
            //Nova Scotia
            db.ExecuteSql("Insert into northAmerica Values('Canada','NS','Annapolis','Annapolis Royal'),('Canada','NS','Annapolis','Bridgetown'),('Canada','NS','Annapolis','Middleton'),('Canada','NS','Antigonish','Antigonish'),('Canada','NS','Antigonish','Livingstone Cove'),('Canada','NS','Cape Breton','Dominion'),('Canada','NS','Cape Breton','Glace Bay'),('Canada','NS','Cape Breton','Louisbourg'),('Canada','NS','Cape Breton','New Waterford'),('Canada','NS','Cape Breton','North Sydney'),('Canada','NS','Cape Breton','Port Hawkesbury'),('Canada','NS','Cape Breton','Sydney'),('Canada','NS','Cape Breton','Sydney Mines'),('Canada','NS','Colchester','Stewiacke'),('Canada','NS','Colchester','Truro'),('Canada','NS','Cumberland','Amherst'),('Canada','NS','Cumberland','Joggins'),('Canada','NS','Cumberland','Oxford'),('Canada','NS','Cumberland','Parrsboro'),('Canada','NS','Cumberland','Springhill'),('Canada','NS','Digby','Digby'),('Canada','NS','Digby','Westport'),('Canada','NS','Guysborough','Canso'),('Canada','NS','Guysborough','Mulgrave')," + 
                "('Canada','NS','Halifax','Bedford'),('Canada','NS','Halifax','Dartmouth'),('Canada','NS','Halifax','Halifax'),('Canada','NS','Hants','Windsor'),('Canada','NS','Hants','Hantsport'),('Canada','NS','Inverness','Inverness'),('Canada','NS','Inverness','Port Hood'),('Canada','NS','Kings','Berwick'),('Canada','NS','Kings','Kentville'),('Canada','NS','Kings','Wolfville'),('Canada','NS','Lunenburg','Bridgewater'),('Canada','NS','Lunenburg','Lunenburg'),('Canada','NS','Lunenburg','Mahone Bay'),('Canada','NS','Pictou','New Glasgow'),('Canada','NS','Pictou','Pictou'),('Canada','NS','Pictou','Stellarton'),('Canada','NS','Pictou','Trenton'),('Canada','NS','Pictou','Westville'),('Canada','NS','Queens','Liverpool'),('Canada','NS','Richmond','St. Peter\'s'),('Canada','NS','Shelburne','Clark\'s Harbour'),('Canada','NS','Shelburne','Lockeport'),('Canada','NS','Shelburne','Shelburne'),('Canada','NS','Victoria','Baddeck'),('Canada','NS','Yarmouth','Wedgeport'),('Canada','NS','Yarmouth','Yarmouth')");
            //Nunavut
            db.ExecuteSql("Insert into northAmerica Values('Canada','NU','Keewatin','Rankin Inlet'),('Canada','NU','Kitikmeot','Cambridge Bay'),('Canada','NU','Baffin','Iqaluit')");
            //Ontario
            db.ExecuteSql("Insert into northAmerica Values('Canada','ON','Central','Bancroft'),('Canada','ON','Central','Barrie'),('Canada','ON','Central','Belleville'),('Canada','ON','Central','Bracebridge'),('Canada','ON','Central','Bradford West Gwillimbury'),('Canada','ON','Central','Cobourg'),('Canada','ON','Central','Collingwood'),('Canada','ON','Central','Grand Valley'),('Canada','ON','Central','Gravenhurst'),('Canada','ON','Central','Huntsville'),('Canada','ON','Central','Innisfil'),('Canada','ON','Central','Kawartha Lakes'),('Canada','ON','Central','Kearney'),('Canada','ON','Central','Midland'),('Canada','ON','Central','Mono'),('Canada','ON','Central','New Tecumseth'),('Canada','ON','Central','Orillia'),('Canada','ON','Central','Parry Sound'),('Canada','ON','Central','Penetanguishene'),('Canada','ON','Central','Peterborough'),('Canada','ON','Central','Prince Edward County'),('Canada','ON','Central','Quinte West'),('Canada','ON','Central','Shelburne'),('Canada','ON','Central','Wasaga Beach'),('Canada','ON','Eastern','Arnprior'),('Canada','ON','Eastern','Brockville'),('Canada','ON','Eastern','Carleton Place'),('Canada','ON','Eastern','Clarence-Rockland'),('Canada','ON','Eastern','Cornwall'),('Canada','ON','Eastern','Deep River'),('Canada','ON','Eastern','Deseronto'),('Canada','ON','Eastern','Gananoque'),('Canada','ON','Eastern','Greater Napanee'),('Canada','ON','Eastern','Hawkesbury'),('Canada','ON','Eastern','Kingston'),('Canada','ON','Eastern','Laurentian Hills'),('Canada','ON','Eastern','Mississippi Mills')," + 
                "('Canada','ON','Eastern','Ottawa'),('Canada','ON','Eastern','Pembroke'),('Canada','ON','Eastern','Perth'),('Canada','ON','Eastern','Petawawa'),('Canada','ON','Eastern','Prescott'),('Canada','ON','Eastern','Renfrew'),('Canada','ON','Eastern','Smiths Falls'),('Canada','ON','Golden Horseshoe','Ajax'),('Canada','ON','Golden Horseshoe','Aurora'),('Canada','ON','Golden Horseshoe','Brampton'),('Canada','ON','Golden Horseshoe','Burlington'),('Canada','ON','Golden Horseshoe','Caledon'),('Canada','ON','Golden Horseshoe','East Gwillimbury'),('Canada','ON','Golden Horseshoe','Erin'),('Canada','ON','Golden Horseshoe','Fort Erie'),('Canada','ON','Golden Horseshoe','Georgina'),('Canada','ON','Golden Horseshoe','Grimsby'),('Canada','ON','Golden Horseshoe','Guelph'),('Canada','ON','Golden Horseshoe','Haldimand County'),('Canada','ON','Golden Horseshoe','Halton Hills'),('Canada','ON','Golden Horseshoe','Hamilton'),('Canada','ON','Golden Horseshoe','Lincoln'),('Canada','ON','Golden Horseshoe','Markham'),('Canada','ON','Golden Horseshoe','Milton'),('Canada','ON','Golden Horseshoe','Mississauga'),('Canada','ON','Golden Horseshoe','Newmarket'),('Canada','ON','Golden Horseshoe','Niagara Falls'),('Canada','ON','Golden Horseshoe','Niagara-on-the-Lake'),('Canada','ON','Golden Horseshoe','Oakville'),('Canada','ON','Golden Horseshoe','Oshawa'),('Canada','ON','Golden Horseshoe','Pelham'),('Canada','ON','Golden Horseshoe','Pickering'),('Canada','ON','Golden Horseshoe','Port Colborne'),('Canada','ON','Golden Horseshoe','Richmond Hill')," + 
                "('Canada','ON','Golden Horseshoe','St. Catharines'),('Canada','ON','Golden Horseshoe','Thorold'),('Canada','ON','Golden Horseshoe','Toronto'),('Canada','ON','Golden Horseshoe','Vaughan'),('Canada','ON','Golden Horseshoe','Welland'),('Canada','ON','Golden Horseshoe','Whitby'),('Canada','ON','Golden Horseshoe','Whitchurch-Stouffville'),('Canada','ON','Northeastern','Blind River'),('Canada','ON','Northeastern','Bruce Mines'),('Canada','ON','Northeastern','Chapleau'),('Canada','ON','Northeastern','Cobalt'),('Canada','ON','Northeastern','Cochrane'),('Canada','ON','Northeastern','Elliot Lake'),('Canada','ON','Northeastern','Englehart'),('Canada','ON','Northeastern','Espanola'),('Canada','ON','Northeastern','French River'),('Canada','ON','Northeastern','Gore Bay'),('Canada','ON','Northeastern','Greater Sudbury'),('Canada','ON','Northeastern','Hearst'),('Canada','ON','Northeastern','Iroquois Falls'),('Canada','ON','Northeastern','Kapuskasing'),('Canada','ON','Northeastern','Kirkland Lake'),('Canada','ON','Northeastern','Latchford'),('Canada','ON','Northeastern','Markstay-Warren'),('Canada','ON','Northeastern','Mattawa'),('Canada','ON','Northeastern','Moosonee'),('Canada','ON','Northeastern','NE Manitoulin and Islands'),('Canada','ON','Northeastern','North Bay'),('Canada','ON','Northeastern','Sault Ste. Marie'),('Canada','ON','Northeastern','Smooth Rock Falls')," + 
                "('Canada','ON','Northeastern','Spanish'),('Canada','ON','Northeastern','St. Charles'),('Canada','ON','Northeastern','Temiskaming Shores'),('Canada','ON','Northeastern','Thessalon'),('Canada','ON','Northeastern','Timmins'),('Canada','ON','Northeastern','West Nipissing'),('Canada','ON','Northwestern','Atikokan'),('Canada','ON','Northwestern','Dryden'),('Canada','ON','Northwestern','Fort Fancis'),('Canada','ON','Northwestern','Kenora'),('Canada','ON','Northwestern','Marathon'),('Canada','ON','Northwestern','Rainy River'),('Canada','ON','Northwestern','Thunder Bay')," + 
                "('Canada','ON','Southwestern','Amherstburg'),('Canada','ON','Southwestern','Aylmer'),('Canada','ON','Southwestern','Brant'),('Canada','ON','Southwestern','Brantford'),('Canada','ON','Southwestern','Cambridge'),('Canada','ON','Southwestern','Essex'),('Canada','ON','Southwestern','Goderich'),('Canada','ON','Southwestern','Hanover'),('Canada','ON','Southwestern','Ingersoll'),('Canada','ON','Southwestern','Kingsville'),('Canada','ON','Southwestern','Kitchener'),('Canada','ON','Southwestern','Lakeshore'),('Canada','ON','Southwestern','LaSalle'),('Canada','ON','Southwestern','London'),('Canada','ON','Southwestern','Minto'),('Canada','ON','Southwestern','Norfolk County'),('Canada','ON','Southwestern','Orangeville'),('Canada','ON','Southwestern','Owen Sound'),('Canada','ON','Southwestern','Petrolia'),('Canada','ON','Southwestern','Plympton-Wyoming'),('Canada','ON','Southwestern','Sarnia'),('Canada','ON','Southwestern','Saugeen Shores'),('Canada','ON','Southwestern','South Bruce Peninsula'),('Canada','ON','Southwestern','Stratford'),('Canada','ON','Southwestern','St. Marys'),('Canada','ON','Southwestern','St. Thomas'),('Canada','ON','Southwestern','Tecumseh'),('Canada','ON','Southwestern','The Blue Mountains'),('Canada','ON','Southwestern','Tillsonburg'),('Canada','ON','Southwestern','Waterloo'),('Canada','ON','Southwestern','Windsor'),('Canada','ON','Southwestern','Woodstock')");
            //Prince Edward Island
            db.ExecuteSql("Insert into northAmerica Values('Canada','PEI','Kings','Georgetown'),('Canada','PEI','Kings','Montague'),('Canada','PEI','Kings','Souris'),('Canada','PEI','Prince','Alberton'),('Canada','PEI','Prince','Borden-Carleton'),('Canada','PEI','Prince','Kensington'),('Canada','PEI','Prince','O\'Leary'),('Canada','PEI','Prince','Summerside'),('Canada','PEI','Prince','Tignish'),('Canada','PEI','Queens','Charlottetown'),('Canada','PEI','Queens','Cornwall'),('Canada','PEI','Queens','North Rustico'),('Canada','PEI','Queens','Stratford')");
            //Quebec
            db.ExecuteSql("Insert into northAmerica Values('Canada','QC','Abitibi-Témiscamingue','Amos'),('Canada','QC','Abitibi-Témiscamingue','Belleterre'),('Canada','QC','Abitibi-Témiscamingue','Duparquet'),('Canada','QC','Abitibi-Témiscamingue','La Sarre'),('Canada','QC','Abitibi-Témiscamingue','Macamic'),('Canada','QC','Abitibi-Témiscamingue','Malartic'),('Canada','QC','Abitibi-Témiscamingue','Rouyn-Noranda'),('Canada','QC','Abitibi-Témiscamingue','Senneterre'),('Canada','QC','Abitibi-Témiscamingue','Témiscaming'),('Canada','QC','Abitibi-Témiscamingue','Val-d\'Or'),('Canada','QC','Abitibi-Témiscamingue','Ville-Marie'),('Canada','QC','Bas-Saint-Laurent','Amqui'),('Canada','QC','Bas-Saint-Laurent','Causapscal'),('Canada','QC','Bas-Saint-Laurent','Dégelis'),('Canada','QC','Bas-Saint-Laurent','La Pocatière'),('Canada','QC','Bas-Saint-Laurent','Matane'),('Canada','QC','Bas-Saint-Laurent','Métis-sur-Mer'),('Canada','QC','Bas-Saint-Laurent','Mont-Joli'),('Canada','QC','Bas-Saint-Laurent','Pohénégamook'),('Canada','QC','Bas-Saint-Laurent','Rimouski'),('Canada','QC','Bas-Saint-Laurent','Rivière-du-Loup'),('Canada','QC','Bas-Saint-Laurent','Saint-Pascal'),('Canada','QC','Bas-Saint-Laurent','Témiscouata-sur-le-Lac'),('Canada','QC','Bas-Saint-Laurent','Trois-Pistoles'),('Canada','QC','Capitale-Nationale','Baie-Saint-Paul'),('Canada','QC','Capitale-Nationale','Beaupré'),('Canada','QC','Capitale-Nationale','Cap-Santé'),('Canada','QC','Capitale-Nationale','Château-Richer'),('Canada','QC','Capitale-Nationale','Clermont')," + 
                "('Canada','QC','Capitale-Nationale','Donnacona'),('Canada','QC','Capitale-Nationale','Fossambault-sur-le-Lac'),('Canada','QC','Capitale-Nationale','La Malbaie'),('Canada','QC','Capitale-Nationale','Lac-Delage'),('Canada','QC','Capitale-Nationale','Lac-Saint-Joseph'),('Canada','QC','Capitale-Nationale','Lac-Sergent'),('Canada','QC','Capitale-Nationale','L\'Ancienne-Lorette'),('Canada','QC','Capitale-Nationale','Neuville'),('Canada','QC','Capitale-Nationale','Pont-Rouge'),('Canada','QC','Capitale-Nationale','Portneuf'),('Canada','QC','Capitale-Nationale','Quebec City'),('Canada','QC','Capitale-Nationale','St.-Augustin-de-Desmaures'),('Canada','QC','Capitale-Nationale','Saint-Basile'),('Canada','QC','Capitale-Nationale','Sainte-Anne-de-Beaupré'),('Canada','QC','Capitale-Nationale','Saint-Marc-des-Carrières'),('Canada','QC','Capitale-Nationale','Saint-Raymond'),('Canada','QC','Capitale-Nationale','St.-Catherine-J.-Cartier'),('Canada','QC','Centre-du-Québec','Bécancour'),('Canada','QC','Centre-du-Québec','Daveluyville'),('Canada','QC','Centre-du-Québec','Drummondville'),('Canada','QC','Centre-du-Québec','Kingsey Falls'),('Canada','QC','Centre-du-Québec','Nicolet'),('Canada','QC','Centre-du-Québec','Plessisville'),('Canada','QC','Centre-du-Québec','Princeville'),('Canada','QC','Centre-du-Québec','Victoriaville'),('Canada','QC','Centre-du-Québec','Warwick'),('Canada','QC','Chaudière-Appalaches','Beauceville'),('Canada','QC','Chaudière-Appalaches','Disraeli'),('Canada','QC','Chaudière-Appalaches','Lévis')," + 
                "('Canada','QC','Chaudière-Appalaches','Montmagny'),('Canada','QC','Chaudière-Appalaches','Sainte-Marie'),('Canada','QC','Chaudière-Appalaches','Saint-Georges'),('Canada','QC','Chaudière-Appalaches','Saint-Joseph-de-Beauce'),('Canada','QC','Chaudière-Appalaches','Saint-Pamphile'),('Canada','QC','Chaudière-Appalaches','Thetford Mines'),('Canada','QC','Côte-Nord','Baie-Comeau'),('Canada','QC','Côte-Nord','Fermont'),('Canada','QC','Côte-Nord','Forestville'),('Canada','QC','Côte-Nord','Port-Cartier'),('Canada','QC','Côte-Nord','Schefferville'),('Canada','QC','Côte-Nord','Sept-Îles'),('Canada','QC','Estrie','Asbestos'),('Canada','QC','Estrie','Coaticook'),('Canada','QC','Estrie','Cookshire-Eaton'),('Canada','QC','Estrie','Danville'),('Canada','QC','Estrie','East Angus'),('Canada','QC','Estrie','Lac-Mégantic'),('Canada','QC','Estrie','Magog'),('Canada','QC','Estrie','Richmond'),('Canada','QC','Estrie','Scotstown'),('Canada','QC','Estrie','Sherbrooke'),('Canada','QC','Estrie','Stanstead'),('Canada','QC','Estrie','Valcourt'),('Canada','QC','Estrie','Waterville'),('Canada','QC','Estrie','Windsor'),('Canada','QC','Gaspésie–Îles-Madeleine','Bonaventure'),('Canada','QC','Gaspésie–Îles-Madeleine','Cap-Chat'),('Canada','QC','Gaspésie–Îles-Madeleine','Carleton-sur-Mer'),('Canada','QC','Gaspésie–Îles-Madeleine','Chandler'),('Canada','QC','Gaspésie–Îles-Madeleine','Gaspé'),('Canada','QC','Gaspésie–Îles-Madeleine','Grande-Rivière'),('Canada','QC','Gaspésie–Îles-Madeleine','Murdochville')," + 
                "('Canada','QC','Gaspésie–Îles-Madeleine','New Richmond'),('Canada','QC','Gaspésie–Îles-Madeleine','Paspébiac'),('Canada','QC','Gaspésie–Îles-Madeleine','Percé'),('Canada','QC','Gaspésie–Îles-Madeleine','Sainte-Anne-des-Monts'),('Canada','QC','Lanaudière','Berthierville'),('Canada','QC','Lanaudière','Charlemagne'),('Canada','QC','Lanaudière','Joliette'),('Canada','QC','Lanaudière','L\'Assomption'),('Canada','QC','Lanaudière','Lavaltrie'),('Canada','QC','Lanaudière','L\'Épiphanie'),('Canada','QC','Lanaudière','Mascouche'),('Canada','QC','Lanaudière','Notre-Dame-des-Prairies'),('Canada','QC','Lanaudière','Repentigny'),('Canada','QC','Lanaudière','Saint-Gabriel'),('Canada','QC','Lanaudière','Saint-Lin-Laurentides'),('Canada','QC','Lanaudière','Terrebonne'),('Canada','QC','Laurentides','Barkmere'),('Canada','QC','Laurentides','Blainville'),('Canada','QC','Laurentides','Boisbriand'),('Canada','QC','Laurentides','Bois-des-Filion'),('Canada','QC','Laurentides','Brownsburg-Chatham'),('Canada','QC','Laurentides','Deux-Montagnes'),('Canada','QC','Laurentides','Estérel'),('Canada','QC','Laurentides','Lachute'),('Canada','QC','Laurentides','Lorraine'),('Canada','QC','Laurentides','Mirabel'),('Canada','QC','Laurentides','Mont-Laurier'),('Canada','QC','Laurentides','Mont-Tremblant'),('Canada','QC','Laurentides','Prèvost'),('Canada','QC','Laurentides','Rivière-Rouge'),('Canada','QC','Laurentides','Rosemère'),('Canada','QC','Laurentides','Saint-Colomban'),('Canada','QC','Laurentides','Sainte-Adèle')," + 
                "('Canada','QC','Laurentides','Sainte-Agathe-des-Monts'),('Canada','QC','Laurentides','Sainte-Anne-des-Plaines'),('Canada','QC','Laurentides','Sainte-Marthe-sur-le-Lac'),('Canada','QC','Laurentides','Sainte-Thérèse'),('Canada','QC','Laurentides','Saint-Eustache'),('Canada','QC','Laurentides','Saint-Jérôme'),('Canada','QC','Laurentides','Saint-Sauveur'),('Canada','QC','Laurentides','St.-Marguerite-Lac-Masson'),('Canada','QC','Laval','Laval'),('Canada','QC','Mauricie','La Tuque'),('Canada','QC','Mauricie','Louiseville'),('Canada','QC','Mauricie','Saint-Tite'),('Canada','QC','Mauricie','Shawinigan'),('Canada','QC','Mauricie','Trois-Rivières'),('Canada','QC','Montérégie','Acton Vale'),('Canada','QC','Montérégie','Beauharnois'),('Canada','QC','Montérégie','Bedford'),('Canada','QC','Montérégie','Beloeil'),('Canada','QC','Montérégie','Boucherville'),('Canada','QC','Montérégie','Brome Lake'),('Canada','QC','Montérégie','Bromont'),('Canada','QC','Montérégie','Brossard'),('Canada','QC','Montérégie','Candiac'),('Canada','QC','Montérégie','Carignan'),('Canada','QC','Montérégie','Chambly'),('Canada','QC','Montérégie','Châteauguay'),('Canada','QC','Montérégie','Contrecoeur'),('Canada','QC','Montérégie','Coteau-du-Lac'),('Canada','QC','Montérégie','Cowansville'),('Canada','QC','Montérégie','Delson'),('Canada','QC','Montérégie','Dunham'),('Canada','QC','Montérégie','Farnham'),('Canada','QC','Montérégie','Granby'),('Canada','QC','Montérégie','Hudson'),('Canada','QC','Montérégie','Huntingdon')," + 
                "('Canada','QC','Montérégie','La Prairie'),('Canada','QC','Montérégie','Léry'),('Canada','QC','Montérégie','L\'Île-Cadieux'),('Canada','QC','Montérégie','L\'Île-Perrot'),('Canada','QC','Montérégie','Longueuil'),('Canada','QC','Montérégie','Marieville'),('Canada','QC','Montérégie','Mercier'),('Canada','QC','Montérégie','Mont-Saint-Hilaire'),('Canada','QC','Montérégie','Notre-Dame-l\'Île-Perrot'),('Canada','QC','Montérégie','Otterburn Park'),('Canada','QC','Montérégie','Pincourt'),('Canada','QC','Montérégie','Richelieu'),('Canada','QC','Montérégie','Saint-Basile-le-Grand'),('Canada','QC','Montérégie','Saint-Césaire'),('Canada','QC','Montérégie','Saint-Constant'),('Canada','QC','Montérégie','Sainte-Catherine'),('Canada','QC','Montérégie','Sainte-Julie'),('Canada','QC','Montérégie','Saint-Hyacinthe'),('Canada','QC','Montérégie','Saint-Jean-sur-Richelieu'),('Canada','QC','Montérégie','Saint-Joseph-de-Sorel'),('Canada','QC','Montérégie','Saint-Lambert'),('Canada','QC','Montérégie','Saint-Lazare'),('Canada','QC','Montérégie','Saint-Ours'),('Canada','QC','Montérégie','Saint-Pie'),('Canada','QC','Montérégie','Saint-Rémi'),('Canada','QC','Montérégie','St.-Bruno-de-Montarville'),('Canada','QC','Montérégie','Salaberry-de-Valleyfield'),('Canada','QC','Montérégie','Sorel-Tracy'),('Canada','QC','Montérégie','Sutton'),('Canada','QC','Montérégie','Varennes'),('Canada','QC','Montérégie','Vaudreuil-Dorion'),('Canada','QC','Montérégie','Waterloo')," + 
                "('Canada','QC','Montréal','Baie-D\'Urfé'),('Canada','QC','Montréal','Beaconsfield'),('Canada','QC','Montréal','Côte Saint-Luc'),('Canada','QC','Montréal','Dollard-des-Ormeaux'),('Canada','QC','Montréal','Dorval'),('Canada','QC','Montréal','Hampstead'),('Canada','QC','Montréal','Kirkland'),('Canada','QC','Montréal','L\'Île-Dorval'),('Canada','QC','Montréal','Montréal'),('Canada','QC','Montréal','Montréal West'),('Canada','QC','Montréal','Montréal-Est'),('Canada','QC','Montréal','Mount Royal'),('Canada','QC','Montréal','Pointe-Claire'),('Canada','QC','Montréal','Sainte-Anne-de-Bellevue'),('Canada','QC','Montréal','Westmount'),('Canada','QC','Nord-du-Québec','Chapais'),('Canada','QC','Nord-du-Québec','Chibougamau'),('Canada','QC','Nord-du-Québec','Lebel-sur-Quévillon'),('Canada','QC','Nord-du-Québec','Matagami'),('Canada','QC','Outaouais','Gatineau'),('Canada','QC','Outaouais','Gracefield'),('Canada','QC','Outaouais','Maniwaki'),('Canada','QC','Outaouais','Thurso'),('Canada','QC','Saguenay–Lac-Saint-Jean','Alma'),('Canada','QC','Saguenay–Lac-Saint-Jean','Desbiens'),('Canada','QC','Saguenay–Lac-Saint-Jean','Dolbeau-Mistassini'),('Canada','QC','Saguenay–Lac-Saint-Jean','Métabetchouan–Lac-à-Croix'),('Canada','QC','Saguenay–Lac-Saint-Jean','Normandin'),('Canada','QC','Saguenay–Lac-Saint-Jean','Roberval'),('Canada','QC','Saguenay–Lac-Saint-Jean','Saguenay'),('Canada','QC','Saguenay–Lac-Saint-Jean','Saint-Félicien')");
            //Saskatchewan
            db.ExecuteSql("Insert into northAmerica Values('Canada','SK','Northern','Big River'),('Canada','SK','Northern','Choiceland'),('Canada','SK','Northern','Flin Flon'),('Canada','SK','Northern','Prince Albert'),('Canada','SK','Northern','Shellbrook'),('Canada','SK','Northern','Spiritwood'),('Canada','SK','East Central','Aborfield'),('Canada','SK','East Central','Birch Hills'),('Canada','SK','East Central','Bredenbury'),('Canada','SK','East Central','Bruno'),('Canada','SK','East Central','Canora'),('Canada','SK','East Central','Carrot River'),('Canada','SK','East Central','Churchbridge'),('Canada','SK','East Central','Cudworth'),('Canada','SK','East Central','Cupar'),('Canada','SK','East Central','Foam Lake'),('Canada','SK','East Central','Govan'),('Canada','SK','East Central','Hudson Bay'),('Canada','SK','East Central','Humboldt'),('Canada','SK','East Central','Imperial'),('Canada','SK','East Central','Ituna'),('Canada','SK','East Central','Kamsack'),('Canada','SK','East Central','Kelvington'),('Canada','SK','East Central','Kinistino'),('Canada','SK','East Central','Langenburg'),('Canada','SK','East Central','Lanigan'),('Canada','SK','East Central','Leroy'),('Canada','SK','East Central','Melfort'),('Canada','SK','East Central','Melville'),('Canada','SK','East Central','Naicam'),('Canada','SK','East Central','Nipawin'),('Canada','SK','East Central','Nokomis'),('Canada','SK','East Central','Norquay'),('Canada','SK','East Central','Porcupine Plain'),('Canada','SK','East Central','Preeceville')," + 
                "('Canada','SK','East Central','Raymore'),('Canada','SK','East Central','Rose Valley'),('Canada','SK','East Central','Saltcoats'),('Canada','SK','East Central','Southey'),('Canada','SK','East Central','Springside'),('Canada','SK','East Central','St. Brieux'),('Canada','SK','East Central','Star City'),('Canada','SK','East Central','Sturgis'),('Canada','SK','East Central','Tisdale'),('Canada','SK','East Central','Wadena'),('Canada','SK','East Central','Wakaw'),('Canada','SK','East Central','Watson'),('Canada','SK','East Central','Wynyard'),('Canada','SK','East Central','Yorkton'),('Canada','SK','West Central','Aberdeen'),('Canada','SK','West Central','Allan'),('Canada','SK','West Central','Asquith'),('Canada','SK','West Central','Battleford'),('Canada','SK','West Central','Biggar'),('Canada','SK','West Central','Blaine Lake'),('Canada','SK','West Central','Colonsay'),('Canada','SK','West Central','Craik'),('Canada','SK','West Central','Cut Knife'),('Canada','SK','West Central','Dalmeny'),('Canada','SK','West Central','Davidson'),('Canada','SK','West Central','Delisle'),('Canada','SK','West Central','Duck Lake'),('Canada','SK','West Central','Dundurn'),('Canada','SK','West Central','Eatonia'),('Canada','SK','West Central','Elrose'),('Canada','SK','West Central','Eston'),('Canada','SK','West Central','Hafford'),('Canada','SK','West Central','Hague'),('Canada','SK','West Central','Hanley'),('Canada','SK','West Central','Hepburn'),('Canada','SK','West Central','Kerrobert'),('Canada','SK','West Central','Kindersley')," + 
                "('Canada','SK','West Central','Langham'),('Canada','SK','West Central','Lashburn'),('Canada','SK','West Central','Lloydminster'),('Canada','SK','West Central','Luseland'),('Canada','SK','West Central','Macklin'),('Canada','SK','West Central','Maidstone'),('Canada','SK','West Central','Marshall'),('Canada','SK','West Central','Martensville'),('Canada','SK','West Central','Meadow Lake'),('Canada','SK','West Central','North Battleford'),('Canada','SK','West Central','Osler'),('Canada','SK','West Central','Outlook'),('Canada','SK','West Central','Radisson'),('Canada','SK','West Central','Rosetown'),('Canada','SK','West Central','Rosthern'),('Canada','SK','West Central','Saskatoon'),('Canada','SK','West Central','Scott'),('Canada','SK','West Central','St. Walburg'),('Canada','SK','West Central','Turtleford'),('Canada','SK','West Central','Unity'),('Canada','SK','West Central','Vonda'),('Canada','SK','West Central','Waldheim'),('Canada','SK','West Central','Warman'),('Canada','SK','West Central','Watrous'),('Canada','SK','West Central','Wilkie'),('Canada','SK','West Central','Zealandia'),('Canada','SK','South East','Alameda'),('Canada','SK','South East','Arcola'),('Canada','SK','South East','Balcarres'),('Canada','SK','South East','Balgonie'),('Canada','SK','South East','Bienfait'),('Canada','SK','South East','Broadview'),('Canada','SK','South East','Carlyle'),('Canada','SK','South East','Carnduff'),('Canada','SK','South East','Esterhazy'),('Canada','SK','South East','Estevan')," + 
                "('Canada','SK','South East','Fleming'),('Canada','SK','South East','Fort Qu Appelle'),('Canada','SK','South East','Francis'),('Canada','SK','South East','Grenfell'),('Canada','SK','South East','Indian Head'),('Canada','SK','South East','Kipling'),('Canada','SK','South East','Lampman'),('Canada','SK','South East','Lemberg'),('Canada','SK','South East','Lumsden'),('Canada','SK','South East','Midale'),('Canada','SK','South East','Milestone'),('Canada','SK','South East','Moosomin'),('Canada','SK','South East','Oxbow'),('Canada','SK','South East','Pilot Butte'),('Canada','SK','South East','Qu Appelle'),('Canada','SK','South East','Radville'),('Canada','SK','South East','Redvers'),('Canada','SK','South East','Regina'),('Canada','SK','South East','Regina Beach'),('Canada','SK','South East','Rocanville'),('Canada','SK','South East','Sintaluta'),('Canada','SK','South East','Stoughton'),('Canada','SK','South East','Strasbourg'),('Canada','SK','South East','Wapella'),('Canada','SK','South East','Wawota'),('Canada','SK','South East','Weyburn'),('Canada','SK','South East','White City'),('Canada','SK','South East','White Wood'),('Canada','SK','South East','Wolseley'),('Canada','SK','South East','Yellow Grass'),('Canada','SK','South West','Assiniboia'),('Canada','SK','South West','Bengough'),('Canada','SK','South West','Burstall'),('Canada','SK','South West','Cabri'),('Canada','SK','South West','Central Butte'),('Canada','SK','South West','Coronach'),('Canada','SK','South West','Eastend')," +
                "('Canada','SK','South West','Grand Coulee'),('Canada','SK','South West','Gravelbourg'),('Canada','SK','South West','Gull Lake'),('Canada','SK','South West','Herbert'),('Canada','SK','South West','Kyle'),('Canada','SK','South West','Lafleche'),('Canada','SK','South West','Leader'),('Canada','SK','South West','Maple Creek'),('Canada','SK','South West','Moose Jaw'),('Canada','SK','South West','Morse'),('Canada','SK','South West','Mossbank'),('Canada','SK','South West','Ogema'),('Canada','SK','South West','Pense'),('Canada','SK','South West','Ponteix'),('Canada','SK','South West','Rockglen'),('Canada','SK','South West','Rouleau'),('Canada','SK','South West','Shaunavon'),('Canada','SK','South West','Swift Current'),('Canada','SK','South West','Willow Bunch')");
            //Yukon
            db.ExecuteSql("Insert into northAmerica Values('Canada','YT','Northern Yukon','Mayo'),('Canada','YT','Klondike','Carmacks'),('Canada','YT','Klondike','Dawson City'),('Canada','YT','Klondike','Haines Junction'),('Canada','YT','Southern Lakes', 'Faro'),('Canada','YT','Southern Lakes', 'Teslin'),('Canada','YT','Southern Lakes', 'Watson Lake'),('Canada','YT','Southern Lakes', 'Whitehorse')");
        }
        function dataUSA(){
            //Alabama 
            db.ExecuteSql("Insert into northAmerica Values('USA','AL','Southern USA','Abbeville'),('USA','AL','Southern USA','Adamsville'),('USA','AL','Southern USA','Addison'),('USA','AL','Southern USA','Akron'),('USA','AL','Southern USA','Alabaster'),('USA','AL','Southern USA','Albertville'),('USA','AL','Southern USA','Alexander City'),('USA','AL','Southern USA','Aliceville'),('USA','AL','Southern USA','Allgood'),('USA','AL','Southern USA','Altoona'),('USA','AL','Southern USA','Andalusia'),('USA','AL','Southern USA','Anderson'),('USA','AL','Southern USA','Anniston'),('USA','AL','Southern USA','Arab'),('USA','AL','Southern USA','Ardmore'),('USA','AL','Southern USA','Argo'),('USA','AL','Southern USA','Ariton'),('USA','AL','Southern USA','Arley'),('USA','AL','Southern USA','Ashford'),('USA','AL','Southern USA','Ashland'),('USA','AL','Southern USA','Ashville'),('USA','AL','Southern USA','Athens'),('USA','AL','Southern USA','Atmore'),('USA','AL','Southern USA','Attalla'),('USA','AL','Southern USA','Auburn'),('USA','AL','Southern USA','Autaugaville'),('USA','AL','Southern USA','Avon'),('USA','AL','Southern USA','Babbie'),('USA','AL','Southern USA','Baileyton'),('USA','AL','Southern USA','Bakerhill'),('USA','AL','Southern USA','Banks'),('USA','AL','Southern USA','Bay Minette'),('USA','AL','Southern USA','Bayou La Batre'),('USA','AL','Southern USA','Bear Creek'),('USA','AL','Southern USA','Beatrice'),('USA','AL','Southern USA','Beaverton'),('USA','AL','Southern USA','Belk'),('USA','AL','Southern USA','Berry'),('USA','AL','Southern USA','Bessemer'),('USA','AL','Southern USA','Billingsley'),('USA','AL','Southern USA','Birmingham')," + 
                "('USA','AL','Southern USA','Black'),('USA','AL','Southern USA','Blountsville'),('USA','AL','Southern USA','Boaz'),('USA','AL','Southern USA','Boligee'),('USA','AL','Southern USA','Bon Air'),('USA','AL','Southern USA','Brantley'),('USA','AL','Southern USA','Brent'),('USA','AL','Southern USA','Brewton'),('USA','AL','Southern USA','Bridgeport'),('USA','AL','Southern USA','Brighton'),('USA','AL','Southern USA','Brilliant'),('USA','AL','Southern USA','Brookside'),('USA','AL','Southern USA','Brookwood'),('USA','AL','Southern USA','Brundidge'),('USA','AL','Southern USA','Butler'),('USA','AL','Southern USA','Calera'),('USA','AL','Southern USA','Camden'),('USA','AL','Southern USA','Camp Hill'),('USA','AL','Southern USA','Carbon Hill'),('USA','AL','Southern USA','Carolina'),('USA','AL','Southern USA','Carrollton'),('USA','AL','Southern USA','Castleberry'),('USA','AL','Southern USA','Cedar Bluff'),('USA','AL','Southern USA','Center Point'),('USA','AL','Southern USA','Centre'),('USA','AL','Southern USA','Centreville'),('USA','AL','Southern USA','Chatom'),('USA','AL','Southern USA','Chelsea'),('USA','AL','Southern USA','Cherokee'),('USA','AL','Southern USA','Chickasaw'),('USA','AL','Southern USA','Childersburg'),('USA','AL','Southern USA','Citronelle'),('USA','AL','Southern USA','Clanton'),('USA','AL','Southern USA','Clay'),('USA','AL','Southern USA','Cleveland'),('USA','AL','Southern USA','Clio'),('USA','AL','Southern USA','Coaling'),('USA','AL','Southern USA','Coffee Springs'),('USA','AL','Southern USA','Coffeeville'),('USA','AL','Southern USA','Coker'),('USA','AL','Southern USA','Collinsville')," + 
                "('USA','AL','Southern USA','Colony'),('USA','AL','Southern USA','Columbia'),('USA','AL','Southern USA','Columbiana'),('USA','AL','Southern USA','Coosada'),('USA','AL','Southern USA','Cordova'),('USA','AL','Southern USA','Cottonwood'),('USA','AL','Southern USA','County Line'),('USA','AL','Southern USA','Courtland'),('USA','AL','Southern USA','Cowarts'),('USA','AL','Southern USA','Creola'),('USA','AL','Southern USA','Crossville'),('USA','AL','Southern USA','Cuba'),('USA','AL','Southern USA','Cullman'),('USA','AL','Southern USA','Cusseta'),('USA','AL','Southern USA','Dadeville'),('USA','AL','Southern USA','Daleville'),('USA','AL','Southern USA','Daphne'),('USA','AL','Southern USA','Dauphin Island'),('USA','AL','Southern USA','Daviston'),('USA','AL','Southern USA','Deatsville'),('USA','AL','Southern USA','Decatur'),('USA','AL','Southern USA','Demopolis'),('USA','AL','Southern USA','Detroit'),('USA','AL','Southern USA','Dodge City'),('USA','AL','Southern USA','Dora'),('USA','AL','Southern USA','Dothan'),('USA','AL','Southern USA','Double Springs'),('USA','AL','Southern USA','Douglas'),('USA','AL','Southern USA','Dozier'),('USA','AL','Southern USA','Dutton'),('USA','AL','Southern USA','East Brewton'),('USA','AL','Southern USA','Ecletic'),('USA','AL','Southern USA','Edwardsville'),('USA','AL','Southern USA','Elba'),('USA','AL','Southern USA','Elberta'),('USA','AL','Southern USA','Eldridge'),('USA','AL','Southern USA','Elkmont'),('USA','AL','Southern USA','Elmore'),('USA','AL','Southern USA','Enterprise'),('USA','AL','Southern USA','Epes'),('USA','AL','Southern USA','Eufaula'),('USA','AL','Southern USA','Eutaw')," + 
                "('USA','AL','Southern USA','Eva'),('USA','AL','Southern USA','Evergreen'),('USA','AL','Southern USA','Excel'),('USA','AL','Southern USA','Fairfield'),('USA','AL','Southern USA','Fairhope'),('USA','AL','Southern USA','Fairview'),('USA','AL','Southern USA','Falkville'),('USA','AL','Southern USA','Faunsdale'),('USA','AL','Southern USA','Fayette'),('USA','AL','Southern USA','Five Points'),('USA','AL','Southern USA','Flomaton'),('USA','AL','Southern USA','Florala'),('USA','AL','Southern USA','Florence'),('USA','AL','Southern USA','Foley'),('USA','AL','Southern USA','Forkland'),('USA','AL','Southern USA','Fort Deposit'),('USA','AL','Southern USA','Fort Payne'),('USA','AL','Southern USA','Franklin'),('USA','AL','Southern USA','Frisco City'),('USA','AL','Southern USA','Fruithurst'),('USA','AL','Southern USA','Fulton'),('USA','AL','Southern USA','Fultondale'),('USA','AL','Southern USA','Fyffe'),('USA','AL','Southern USA','Gadsden'),('USA','AL','Southern USA','Gainesville'),('USA','AL','Southern USA','Gantt'),('USA','AL','Southern USA','Garden City'),('USA','AL','Southern USA','Gardendale'),('USA','AL','Southern USA','Gaylesville'),('USA','AL','Southern USA','Geiger'),('USA','AL','Southern USA','Geneva'),('USA','AL','Southern USA','Georgiana'),('USA','AL','Southern USA','Geraldine'),('USA','AL','Southern USA','Gilbertown'),('USA','AL','Southern USA','Glen Allen'),('USA','AL','Southern USA','Glencoe'),('USA','AL','Southern USA','Glenwood'),('USA','AL','Southern USA','Good Hope'),('USA','AL','Southern USA','Goodwater'),('USA','AL','Southern USA','Gordo'),('USA','AL','Southern USA','Gordon')," + 
                "('USA','AL','Southern USA','Gordonville'),('USA','AL','Southern USA','Goshen'),('USA','AL','Southern USA','Grant'),('USA','AL','Southern USA','Graysville'),('USA','AL','Southern USA','Greensboro'),('USA','AL','Southern USA','Greenville'),('USA','AL','Southern USA','Grimes'),('USA','AL','Southern USA','Grove Hill'),('USA','AL','Southern USA','Guin'),('USA','AL','Southern USA','Gulf Shores'),('USA','AL','Southern USA','Guntersville'),('USA','AL','Southern USA','Gurley'),('USA','AL','Southern USA','Gu-Win'),('USA','AL','Southern USA','Hackleburg'),('USA','AL','Southern USA','Haleburg'),('USA','AL','Southern USA','Haleyville'),('USA','AL','Southern USA','Hamilton'),('USA','AL','Southern USA','Hammondville'),('USA','AL','Southern USA','Hanceville'),('USA','AL','Southern USA','Harpersville'),('USA','AL','Southern USA','Hartford'),('USA','AL','Southern USA','Hartselle'),('USA','AL','Southern USA','Hayden'),('USA','AL','Southern USA','Hayneville'),('USA','AL','Southern USA','Headland'),('USA','AL','Southern USA','Heath'),('USA','AL','Southern USA','Heflin'),('USA','AL','Southern USA','Helena'),('USA','AL','Southern USA','Henagar'),('USA','AL','Southern USA','Highland Lake'),('USA','AL','Southern USA','Hillsboro'),('USA','AL','Southern USA','Hobson City'),('USA','AL','Southern USA','Hodges'),('USA','AL','Southern USA','Hokes Bluffs'),('USA','AL','Southern USA','Holly Pond'),('USA','AL','Southern USA','Hollywood'),('USA','AL','Southern USA','Homewood'),('USA','AL','Southern USA','Hoover'),('USA','AL','Southern USA','Horn Hill'),('USA','AL','Southern USA','Hueytown'),('USA','AL','Southern USA','Huntsville')," + 
                "('USA','AL','Southern USA','Hurtsboro'),('USA','AL','Southern USA','Hytop'),('USA','AL','Southern USA','Ider'),('USA','AL','Southern USA','Indian Springs Village'),('USA','AL','Southern USA','Irondale'),('USA','AL','Southern USA','Jackson'),('USA','AL','Southern USA','Jackson\'s Gap'),('USA','AL','Southern USA','Jacksonville'),('USA','AL','Southern USA','Jasper'),('USA','AL','Southern USA','Jemison'),('USA','AL','Southern USA','Kansas'),('USA','AL','Southern USA','Kellyton'),('USA','AL','Southern USA','Kennedy'),('USA','AL','Southern USA','Killen'),('USA','AL','Southern USA','Kimberly'),('USA','AL','Southern USA','Kinsey'),('USA','AL','Southern USA','Kinston'),('USA','AL','Southern USA','La Fayette'),('USA','AL','Southern USA','Lake View'),('USA','AL','Southern USA','Lakeview'),('USA','AL','Southern USA','Lanett'),('USA','AL','Southern USA','Langston'),('USA','AL','Southern USA','Leeds'),('USA','AL','Southern USA','Leesburg'),('USA','AL','Southern USA','Leighton'),('USA','AL','Southern USA','Lester'),('USA','AL','Southern USA','Level Plains'),('USA','AL','Southern USA','Lexington'),('USA','AL','Southern USA','Libertyville'),('USA','AL','Southern USA','Lincoln'),('USA','AL','Southern USA','Linden'),('USA','AL','Southern USA','Lineville'),('USA','AL','Southern USA','Lipscomb'),('USA','AL','Southern USA','Lisman'),('USA','AL','Southern USA','Littleville'),('USA','AL','Southern USA','Livingston'),('USA','AL','Southern USA','Loachapoka'),('USA','AL','Southern USA','Lockhart'),('USA','AL','Southern USA','Locust Fork'),('USA','AL','Southern USA','Louisville'),('USA','AL','Southern USA','Lowndesboro')," + 
                "('USA','AL','Southern USA','Loxley'),('USA','AL','Southern USA','Luverne'),('USA','AL','Southern USA','Lynn'),('USA','AL','Southern USA','Madison'),('USA','AL','Southern USA','Madrid'),('USA','AL','Southern USA','Magnolia Springs'),('USA','AL','Southern USA','Malvern'),('USA','AL','Southern USA','Maplesville'),('USA','AL','Southern USA','Margaret'),('USA','AL','Southern USA','Marion'),('USA','AL','Southern USA','Maytown'),('USA','AL','Southern USA','McIntosh'),('USA','AL','Southern USA','McKenzie'),('USA','AL','Southern USA','Mentone'),('USA','AL','Southern USA','Midfield'),('USA','AL','Southern USA','Midland City'),('USA','AL','Southern USA','Midway'),('USA','AL','Southern USA','Millbrook'),('USA','AL','Southern USA','Millport'),('USA','AL','Southern USA','Millry'),('USA','AL','Southern USA','Mobile'),('USA','AL','Southern USA','Monroeville'),('USA','AL','Southern USA','Montevallo'),('USA','AL','Southern USA','Montgomery'),('USA','AL','Southern USA','Moody'),('USA','AL','Southern USA','Morris'),('USA','AL','Southern USA','Mosses'),('USA','AL','Southern USA','Moulton'),('USA','AL','Southern USA','Moundville'),('USA','AL','Southern USA','Mount Vernon'),('USA','AL','Southern USA','Mountain Brook'),('USA','AL','Southern USA','Mulga'),('USA','AL','Southern USA','Munford'),('USA','AL','Southern USA','Muscle Shoals'),('USA','AL','Southern USA','Myrtlewood'),('USA','AL','Southern USA','Napier Field'),('USA','AL','Southern USA','Nauvoo'),('USA','AL','Southern USA','Nectar'),('USA','AL','Southern USA','New Brockton'),('USA','AL','Southern USA','New Hope'),('USA','AL','Southern USA','New Site')," + 
                "('USA','AL','Southern USA','Newbern'),('USA','AL','Southern USA','Newton'),('USA','AL','Southern USA','Newville'),('USA','AL','Southern USA','North Courtland'),('USA','AL','Southern USA','North Johns'),('USA','AL','Southern USA','Northport'),('USA','AL','Southern USA','Notasulga'),('USA','AL','Southern USA','Oak Grove'),('USA','AL','Southern USA','Oakman'),('USA','AL','Southern USA','Odenville'),('USA','AL','Southern USA','Ohatchee'),('USA','AL','Southern USA','Oneonta'),('USA','AL','Southern USA','Onycha'),('USA','AL','Southern USA','Opelika'),('USA','AL','Southern USA','Opp'),('USA','AL','Southern USA','Orange Beach'),('USA','AL','Southern USA','Orrville'),('USA','AL','Southern USA','Owens Cross Roads'),('USA','AL','Southern USA','Oxford'),('USA','AL','Southern USA','Ozark'),('USA','AL','Southern USA','Paint Rock'),('USA','AL','Southern USA','Parrish'),('USA','AL','Southern USA','Pelham'),('USA','AL','Southern USA','Pell City'),('USA','AL','Southern USA','Pennington'),('USA','AL','Southern USA','Perdido Beach'),('USA','AL','Southern USA','Phenix City'),('USA','AL','Southern USA','Phil Campbell'),('USA','AL','Southern USA','Pickensville'),('USA','AL','Southern USA','Piedmont'),('USA','AL','Southern USA','Pike Road'),('USA','AL','Southern USA','Pinckard'),('USA','AL','Southern USA','Pine Apple'),('USA','AL','Southern USA','Pine Hill'),('USA','AL','Southern USA','Pine Ridge'),('USA','AL','Southern USA','Pinson'),('USA','AL','Southern USA','Pisgah'),('USA','AL','Southern USA','Pleasant Grove'),('USA','AL','Southern USA','Pleasant Groves'),('USA','AL','Southern USA','Pollard')," + 
                "('USA','AL','Southern USA','Powell'),('USA','AL','Southern USA','Prattville'),('USA','AL','Southern USA','Priceville'),('USA','AL','Southern USA','Prichard'),('USA','AL','Southern USA','Providence'),('USA','AL','Southern USA','Ragland'),('USA','AL','Southern USA','Rainbow City'),('USA','AL','Southern USA','Rainsville'),('USA','AL','Southern USA','Ranburne'),('USA','AL','Southern USA','Red Bay'),('USA','AL','Southern USA','Red Level'),('USA','AL','Southern USA','Reece City'),('USA','AL','Southern USA','Reform'),('USA','AL','Southern USA','Rehobeth'),('USA','AL','Southern USA','Repton'),('USA','AL','Southern USA','Ridgeville'),('USA','AL','Southern USA','River Falls'),('USA','AL','Southern USA','Riverside'),('USA','AL','Southern USA','Riverview'),('USA','AL','Southern USA','Roanoke'),('USA','AL','Southern USA','Robertsdale'),('USA','AL','Southern USA','Rockford'),('USA','AL','Southern USA','Rogersville'),('USA','AL','Southern USA','Rosa'),('USA','AL','Southern USA','Russellville'),('USA','AL','Southern USA','Rutledge'),('USA','AL','Southern USA','Samson'),('USA','AL','Southern USA','Sand Rock'),('USA','AL','Southern USA','Sanford'),('USA','AL','Southern USA','Saraland'),('USA','AL','Southern USA','Sardis City'),('USA','AL','Southern USA','Satsuma'),('USA','AL','Southern USA','Scottsboro'),('USA','AL','Southern USA','Section'),('USA','AL','Southern USA','Selma'),('USA','AL','Southern USA','Sheffield'),('USA','AL','Southern USA','Shiloh'),('USA','AL','Southern USA','Shorter'),('USA','AL','Southern USA','Silas'),('USA','AL','Southern USA','Silverhill'),('USA','AL','Southern USA','Sipsey')," + 
                "('USA','AL','Southern USA','Skyline'),('USA','AL','Southern USA','Slocomb'),('USA','AL','Southern USA','Smiths Station'),('USA','AL','Southern USA','Snead'),('USA','AL','Southern USA','Somerville'),('USA','AL','Southern USA','South Vinemont'),('USA','AL','Southern USA','Southside'),('USA','AL','Southern USA','Spanish Fort'),('USA','AL','Southern USA','Springville'),('USA','AL','Southern USA','St. Florian'),('USA','AL','Southern USA','Steele'),('USA','AL','Southern USA','Stevenson'),('USA','AL','Southern USA','Sulligent'),('USA','AL','Southern USA','Sumiton'),('USA','AL','Southern USA','Summerdale'),('USA','AL','Southern USA','Susan Moore'),('USA','AL','Southern USA','Sweet Water'),('USA','AL','Southern USA','Sylacauga'),('USA','AL','Southern USA','Sylvan Springs'),('USA','AL','Southern USA','Sylvania'),('USA','AL','Southern USA','Talladega Springs'),('USA','AL','Southern USA','Talladega'),('USA','AL','Southern USA','Tallassee'),('USA','AL','Southern USA','Tarrant'),('USA','AL','Southern USA','Taylor'),('USA','AL','Southern USA','Thomaston'),('USA','AL','Southern USA','Thomasville'),('USA','AL','Southern USA','Thorsby'),('USA','AL','Southern USA','Town Creek'),('USA','AL','Southern USA','Toxey'),('USA','AL','Southern USA','Trafford'),('USA','AL','Southern USA','Triana'),('USA','AL','Southern USA','Trinity'),('USA','AL','Southern USA','Troy'),('USA','AL','Southern USA','Trussville'),('USA','AL','Southern USA','Tuscaloosa'),('USA','AL','Southern USA','Tuscumbia'),('USA','AL','Southern USA','Tuskegee'),('USA','AL','Southern USA','Twin'),('USA','AL','Southern USA','Union Springs')," + 
                "('USA','AL','Southern USA','Union'),('USA','AL','Southern USA','Uniontown'),('USA','AL','Southern USA','Valley'),('USA','AL','Southern USA','Valley Grande'),('USA','AL','Southern USA','Valley Head'),('USA','AL','Southern USA','Vance'),('USA','AL','Southern USA','Vernon'),('USA','AL','Southern USA','Vestavia Hills'),('USA','AL','Southern USA','Vina'),('USA','AL','Southern USA','Vincent'),('USA','AL','Southern USA','Vredenburgh'),('USA','AL','Southern USA','Wadley'),('USA','AL','Southern USA','Waldo'),('USA','AL','Southern USA','Walnut Grove'),('USA','AL','Southern USA','Warrior'),('USA','AL','Southern USA','Waterloo'),('USA','AL','Southern USA','Waverly'),('USA','AL','Southern USA','Weaver'),('USA','AL','Southern USA','Webb'),('USA','AL','Southern USA','Wedowee'),('USA','AL','Southern USA','West Blocton'),('USA','AL','Southern USA','West Jefferson'),('USA','AL','Southern USA','West Point'),('USA','AL','Southern USA','Westover'),('USA','AL','Southern USA','Wetumpka'),('USA','AL','Southern USA','White Hall'),('USA','AL','Southern USA','Wilsonville'),('USA','AL','Southern USA','Wilton'),('USA','AL','Southern USA','Winfield'),('USA','AL','Southern USA','Woodland'),('USA','AL','Southern USA','Woodstock'),('USA','AL','Southern USA','Woodville'),('USA','AL','Southern USA','Yellow Bluff'),('USA','AL','Southern USA','York')");
            //Alaska
            db.ExecuteSql("Insert into northAmerica Values('USA','AK','Western USA','Adak'),('USA','AK','Western USA','Akhiok'),('USA','AK','Western USA','Akiak'),('USA','AK','Western USA','Akutan'),('USA','AK','Western USA','Alakanuk'),('USA','AK','Western USA','Aleknagik'),('USA','AK','Western USA','Allakaket'),('USA','AK','Western USA','Ambler'),('USA','AK','Western USA','Anaktuvuk Pass'),('USA','AK','Western USA','Anchorage'),('USA','AK','Western USA','Anderson'),('USA','AK','Western USA','Angoon'),('USA','AK','Western USA','Aniak'),('USA','AK','Western USA','Anvik'),('USA','AK','Western USA','Atka'),('USA','AK','Western USA','Atqasuk'),('USA','AK','Western USA','Bethel'),('USA','AK','Western USA','Brevig Mission'),('USA','AK','Western USA','Buckland'),('USA','AK','Western USA','Chefornak'),('USA','AK','Western USA','Chevak'),('USA','AK','Western USA','Chignik'),('USA','AK','Western USA','Chuathbaluk'),('USA','AK','Western USA','Clark\'s Point'),('USA','AK','Western USA','Coffman Cove'),('USA','AK','Western USA','Cold Bay'),('USA','AK','Western USA','Cordova'),('USA','AK','Western USA','Craig'),('USA','AK','Western USA','Deering'),('USA','AK','Western USA','Delta Junction'),('USA','AK','Western USA','Dillingham'),('USA','AK','Western USA','Diomede'),('USA','AK','Western USA','Eagle'),('USA','AK','Western USA','Eek'),('USA','AK','Western USA','Egegik'),('USA','AK','Western USA','Ekwok'),('USA','AK','Western USA','Elim'),('USA','AK','Western USA','Emmonak'),('USA','AK','Western USA','Fairbanks'),('USA','AK','Western USA','Fort Yukon'),('USA','AK','Western USA','Galena'),('USA','AK','Western USA','Gambell')," + 
                "('USA','AK','Western USA','Golovin'),('USA','AK','Western USA','Goodnews Bay'),('USA','AK','Western USA','Grayling'),('USA','AK','Western USA','Gustavus'),('USA','AK','Western USA','Holy Cross'),('USA','AK','Western USA','Homer'),('USA','AK','Western USA','Hoonah'),('USA','AK','Western USA','Hooper Bay'),('USA','AK','Western USA','Houston'),('USA','AK','Western USA','Hughes'),('USA','AK','Western USA','Huslia'),('USA','AK','Western USA','Hydaburg'),('USA','AK','Western USA','Juneau'),('USA','AK','Western USA','Kachemak'),('USA','AK','Western USA','Kake'),('USA','AK','Western USA','Kaktovik'),('USA','AK','Western USA','Kaltag'),('USA','AK','Western USA','Kasaan'),('USA','AK','Western USA','Kenai'),('USA','AK','Western USA','Ketchikan'),('USA','AK','Western USA','Kiana'),('USA','AK','Western USA','King Cove'),('USA','AK','Western USA','Kivalina'),('USA','AK','Western USA','Klawock'),('USA','AK','Western USA','Kobuk'),('USA','AK','Western USA','Kodiak'),('USA','AK','Western USA','Kotlik'),('USA','AK','Western USA','Kotzebue'),('USA','AK','Western USA','Koyuk'),('USA','AK','Western USA','Koyukuk'),('USA','AK','Western USA','Kwethluk'),('USA','AK','Western USA','Larsen Bay'),('USA','AK','Western USA','Lower Kalskag'),('USA','AK','Western USA','Manokotak'),('USA','AK','Western USA','Marshall'),('USA','AK','Western USA','McGrath'),('USA','AK','Western USA','Mekoryuk'),('USA','AK','Western USA','Mountain Village'),('USA','AK','Western USA','Napakiak'),('USA','AK','Western USA','Napaskiak'),('USA','AK','Western USA','Nenana'),('USA','AK','Western USA','New Stuyahok'),('USA','AK','Western USA','Newhalen')," + 
                "('USA','AK','Western USA','Nightmute'),('USA','AK','Western USA','Nikolai'),('USA','AK','Western USA','Nome'),('USA','AK','Western USA','Nondalton'),('USA','AK','Western USA','Noorvik'),('USA','AK','Western USA','North Pole'),('USA','AK','Western USA','Nuiqsut'),('USA','AK','Western USA','Nulato'),('USA','AK','Western USA','Nunam Iqua'),('USA','AK','Western USA','Nunapitchuk'),('USA','AK','Western USA','Old Harbor'),('USA','AK','Western USA','Ouzinkie'),('USA','AK','Western USA','Palmer'),('USA','AK','Western USA','Pelican'),('USA','AK','Western USA','Pilot Point'),('USA','AK','Western USA','Pilot Station'),('USA','AK','Western USA','Platinum'),('USA','AK','Western USA','Point Hope'),('USA','AK','Western USA','Port Heiden'),('USA','AK','Western USA','Port Lions'),('USA','AK','Western USA','Quinhagak'),('USA','AK','Western USA','Ruby'),('USA','AK','Western USA','Russian Mission'),('USA','AK','Western USA','Saint Paul'),('USA','AK','Western USA','Sand Point'),('USA','AK','Western USA','Savoonga'),('USA','AK','Western USA','Saxman'),('USA','AK','Western USA','Scammon Bay'),('USA','AK','Western USA','Selawik'),('USA','AK','Western USA','Seldovia'),('USA','AK','Western USA','Seward'),('USA','AK','Western USA','Shageluk'),('USA','AK','Western USA','Shaktoolik'),('USA','AK','Western USA','Shishmaref'),('USA','AK','Western USA','Shungnak'),('USA','AK','Western USA','Sitka'),('USA','AK','Western USA','Soldotna'),('USA','AK','Western USA','Stebbins'),('USA','AK','Western USA','St. George'),('USA','AK','Western USA','St. Mary\'s'),('USA','AK','Western USA','St. Michael')," + 
                "('USA','AK','Western USA','Tanana'),('USA','AK','Western USA','Teller'),('USA','AK','Western USA','Tenakee Springs'),('USA','AK','Western USA','Thorne Bay'),('USA','AK','Western USA','Togiak'),('USA','AK','Western USA','Toksook Bay'),('USA','AK','Western USA','Unalakleet'),('USA','AK','Western USA','Unalaska'),('USA','AK','Western USA','Upper Kalskag'),('USA','AK','Western USA','Utqiagvik'),('USA','AK','Western USA','Valdez'),('USA','AK','Western USA','Wainwright'),('USA','AK','Western USA','Wales'),('USA','AK','Western USA','Wasilla'),('USA','AK','Western USA','White Mountain'),('USA','AK','Western USA','Whittier'),('USA','AK','Western USA','Wrangell')");
            //Arizona
            db.ExecuteSql("Insert into northAmerica Values('USA','AZ','Western USA','Apache Junction'),('USA','AZ','Western USA','Avondale'),('USA','AZ','Western USA','Benson'),('USA','AZ','Western USA','Bisbee'),('USA','AZ','Western USA','Buckeye'),('USA','AZ','Western USA','Bullhead City'),('USA','AZ','Western USA','Camp Verde'),('USA','AZ','Western USA','Carefree'),('USA','AZ','Western USA','Casa Grande'),('USA','AZ','Western USA','Cave Creek'),('USA','AZ','Western USA','Chandler'),('USA','AZ','Western USA','Chino Valley'),('USA','AZ','Western USA','Clarkdale'),('USA','AZ','Western USA','Clifton'),('USA','AZ','Western USA','Colorado City'),('USA','AZ','Western USA','Coolidge'),('USA','AZ','Western USA','Cottonwood'),('USA','AZ','Western USA','Dewey-Humboldt'),('USA','AZ','Western USA','Douglas'),('USA','AZ','Western USA','Duncan'),('USA','AZ','Western USA','Eagar'),('USA','AZ','Western USA','El Mirage'),('USA','AZ','Western USA','Eloy'),('USA','AZ','Western USA','Flagstaff'),('USA','AZ','Western USA','Florence'),('USA','AZ','Western USA','Fountain Hills'),('USA','AZ','Western USA','Fredonia'),('USA','AZ','Western USA','Gila Bend'),('USA','AZ','Western USA','Gilbert'),('USA','AZ','Western USA','Glendale'),('USA','AZ','Western USA','Globe'),('USA','AZ','Western USA','Goodyear'),('USA','AZ','Western USA','Guadalupe'),('USA','AZ','Western USA','Hayden'),('USA','AZ','Western USA','Holbrook'),('USA','AZ','Western USA','Huachuaca City'),('USA','AZ','Western USA','Jerome'),('USA','AZ','Western USA','Kearny'),('USA','AZ','Western USA','Kingman'),('USA','AZ','Western USA','Lake Havasu City')," + 
                "('USA','AZ','Western USA','Litchfield Park'),('USA','AZ','Western USA','Mammoth'),('USA','AZ','Western USA','Marana'),('USA','AZ','Western USA','Maricopa'),('USA','AZ','Western USA','Mesa'),('USA','AZ','Western USA','Miami'),('USA','AZ','Western USA','Nogales'),('USA','AZ','Western USA','Oro Valley'),('USA','AZ','Western USA','Page'),('USA','AZ','Western USA','Paradise Valley'),('USA','AZ','Western USA','Parker'),('USA','AZ','Western USA','Patagonia'),('USA','AZ','Western USA','Payson'),('USA','AZ','Western USA','Peoria'),('USA','AZ','Western USA','Phoenix'),('USA','AZ','Western USA','Pima'),('USA','AZ','Western USA','Pinetop-Lakeside'),('USA','AZ','Western USA','Prescott'),('USA','AZ','Western USA','Prescott Valley'),('USA','AZ','Western USA','Quartzsite'),('USA','AZ','Western USA','Queen Creek'),('USA','AZ','Western USA','Safford'),('USA','AZ','Western USA','Sahuarita'),('USA','AZ','Western USA','San Luis'),('USA','AZ','Western USA','Scottsdale'),('USA','AZ','Western USA','Sedona'),('USA','AZ','Western USA','Show Low'),('USA','AZ','Western USA','Sierra Vista'),('USA','AZ','Western USA','Snowflake'),('USA','AZ','Western USA','Somerton'),('USA','AZ','Western USA','South Tucson'),('USA','AZ','Western USA','Springerville'),('USA','AZ','Western USA','Star Valley'),('USA','AZ','Western USA','St. Johns'),('USA','AZ','Western USA','Superior'),('USA','AZ','Western USA','Surprise')," + 
                "('USA','AZ','Western USA','Taylor'),('USA','AZ','Western USA','Tempe'),('USA','AZ','Western USA','Thatcher'),('USA','AZ','Western USA','Tolleson'),('USA','AZ','Western USA','Tombstone'),('USA','AZ','Western USA','Tucson'),('USA','AZ','Western USA','Tusayan'),('USA','AZ','Western USA','Wellton'),('USA','AZ','Western USA','Wickenburg'),('USA','AZ','Western USA','Willcox'),('USA','AZ','Western USA','Williams'),('USA','AZ','Western USA','Winkelman'),('USA','AZ','Western USA','Winslow'),('USA','AZ','Western USA','Youngtown'),('USA','AZ','Western USA','Yuma')");
            //Arkansas
            db.ExecuteSql("Insert into northAmerica Values('USA','AR','Southern USA','Adona'),('USA','AR','Southern USA','Alexander'),('USA','AR','Southern USA','Alicia'),('USA','AR','Southern USA','Allport'),('USA','AR','Southern USA','Alma'),('USA','AR','Southern USA','Almyra'),('USA','AR','Southern USA','Alpena'),('USA','AR','Southern USA','Altheimer'),('USA','AR','Southern USA','Altus'),('USA','AR','Southern USA','Amity'),('USA','AR','Southern USA','Anthonyville'),('USA','AR','Southern USA','Antoine'),('USA','AR','Southern USA','Arkadelphia'),('USA','AR','Southern USA','Arkansas City'),('USA','AR','Southern USA','Ash Flat'),('USA','AR','Southern USA','Ashdown'),('USA','AR','Southern USA','Atkins'),('USA','AR','Southern USA','Aubrey'),('USA','AR','Southern USA','Augusta'),('USA','AR','Southern USA','Austin'),('USA','AR','Southern USA','Avoca'),('USA','AR','Southern USA','Bald Knob'),('USA','AR','Southern USA','Banks'),('USA','AR','Southern USA','Barling'),('USA','AR','Southern USA','Bassett'),('USA','AR','Southern USA','Batesville'),('USA','AR','Southern USA','Bauxite'),('USA','AR','Southern USA','Bay'),('USA','AR','Southern USA','Bearden'),('USA','AR','Southern USA','Beaver'),('USA','AR','Southern USA','Beebe'),('USA','AR','Southern USA','Beedeville'),('USA','AR','Southern USA','Bella Vista'),('USA','AR','Southern USA','Bellefonte'),('USA','AR','Southern USA','Belleville'),('USA','AR','Southern USA','Ben Lomond'),('USA','AR','Southern USA','Benton'),('USA','AR','Southern USA','Bentonville'),('USA','AR','Southern USA','Bergman'),('USA','AR','Southern USA','Berryville'),('USA','AR','Southern USA','Bethel Heights')," + 
                "('USA','AR','Southern USA','Big Flat'),('USA','AR','Southern USA','Bigelow'),('USA','AR','Southern USA','Biggers'),('USA','AR','Southern USA','Black Oak'),('USA','AR','Southern USA','Black Rock'),('USA','AR','Southern USA','Blevins'),('USA','AR','Southern USA','Blue Mountain'),('USA','AR','Southern USA','Bluff City'),('USA','AR','Southern USA','Blytheville'),('USA','AR','Southern USA','Bodcaw'),('USA','AR','Southern USA','Bonanza'),('USA','AR','Southern USA','Bono'),('USA','AR','Southern USA','Booneville'),('USA','AR','Southern USA','Bradford'),('USA','AR','Southern USA','Bradley'),('USA','AR','Southern USA','Branch'),('USA','AR','Southern USA','Briarcliff'),('USA','AR','Southern USA','Brinkley'),('USA','AR','Southern USA','Brookland'),('USA','AR','Southern USA','Bryant'),('USA','AR','Southern USA','Buckner'),('USA','AR','Southern USA','Bull Shoals'),('USA','AR','Southern USA','Burdette'),('USA','AR','Southern USA','Cabot'),('USA','AR','Southern USA','Caddo Valley'),('USA','AR','Southern USA','Caldwell'),('USA','AR','Southern USA','Calico Rock'),('USA','AR','Southern USA','Calion'),('USA','AR','Southern USA','Camden'),('USA','AR','Southern USA','Cammack Village'),('USA','AR','Southern USA','Campbell Station'),('USA','AR','Southern USA','Caraway'),('USA','AR','Southern USA','Carlisle'),('USA','AR','Southern USA','Carthage'),('USA','AR','Southern USA','Casa'),('USA','AR','Southern USA','Cash'),('USA','AR','Southern USA','Caulksville'),('USA','AR','Southern USA','Cave City'),('USA','AR','Southern USA','Cave Springs'),('USA','AR','Southern USA','Cedarville'),('USA','AR','Southern USA','Centerton')," + 
                "('USA','AR','Southern USA','Central City'),('USA','AR','Southern USA','Charleston'),('USA','AR','Southern USA','Cherokee Village'),('USA','AR','Southern USA','Cherry Valley'),('USA','AR','Southern USA','Chester'),('USA','AR','Southern USA','Chidester'),('USA','AR','Southern USA','Clarendon'),('USA','AR','Southern USA','Clarkedale'),('USA','AR','Southern USA','Clarksville'),('USA','AR','Southern USA','Clinton'),('USA','AR','Southern USA','Coal Hill'),('USA','AR','Southern USA','Colt'),('USA','AR','Southern USA','Concord'),('USA','AR','Southern USA','Conway'),('USA','AR','Southern USA','Corning'),('USA','AR','Southern USA','Cotter'),('USA','AR','Southern USA','Cotton Plant'),('USA','AR','Southern USA','Cove'),('USA','AR','Southern USA','Crawfordsville'),('USA','AR','Southern USA','Crossett'),('USA','AR','Southern USA','Cushman'),('USA','AR','Southern USA','Daisy'),('USA','AR','Southern USA','Damascus'),('USA','AR','Southern USA','Danville'),('USA','AR','Southern USA','Dardanelle'),('USA','AR','Southern USA','De Queen'),('USA','AR','Southern USA','Decatur'),('USA','AR','Southern USA','Delaplaine'),('USA','AR','Southern USA','Delight'),('USA','AR','Southern USA','Dell'),('USA','AR','Southern USA','Denning'),('USA','AR','Southern USA','Dermott'),('USA','AR','Southern USA','Des Arc'),('USA','AR','Southern USA','DeValls Bluff'),('USA','AR','Southern USA','DeWitt'),('USA','AR','Southern USA','Diamond City'),('USA','AR','Southern USA','Diaz'),('USA','AR','Southern USA','Dierks'),('USA','AR','Southern USA','Donaldson'),('USA','AR','Southern USA','Dover'),('USA','AR','Southern USA','Dumas')," + 
                "('USA','AR','Southern USA','Dyer'),('USA','AR','Southern USA','Dyess'),('USA','AR','Southern USA','Earle'),('USA','AR','Southern USA','East Camden'),('USA','AR','Southern USA','Edmondson'),('USA','AR','Southern USA','Egypt'),('USA','AR','Southern USA','El Dorado'),('USA','AR','Southern USA','Elaine'),('USA','AR','Southern USA','Ekins'),('USA','AR','Southern USA','Elm Springs'),('USA','AR','Southern USA','Emerson'),('USA','AR','Southern USA','Emmet'),('USA','AR','Southern USA','England'),('USA','AR','Southern USA','Enola'),('USA','AR','Southern USA','Etowah'),('USA','AR','Southern USA','Eudora'),('USA','AR','Southern USA','Eureka Springs'),('USA','AR','Southern USA','Evening Shade'),('USA','AR','Southern USA','Everton'),('USA','AR','Southern USA','Fairfield Bay'),('USA','AR','Southern USA','Farmington'),('USA','AR','Southern USA','Fayetteville'),('USA','AR','Southern USA','Felsenthal'),('USA','AR','Southern USA','Fifty-Six'),('USA','AR','Southern USA','Fisher'),('USA','AR','Southern USA','Flippin'),('USA','AR','Southern USA','Fordyce'),('USA','AR','Southern USA','Foreman'),('USA','AR','Southern USA','Forrest City'),('USA','AR','Southern USA','Fort Smith'),('USA','AR','Southern USA','Fouke'),('USA','AR','Southern USA','Fountain Hill'),('USA','AR','Southern USA','Fountain Lake'),('USA','AR','Southern USA','Franklin'),('USA','AR','Southern USA','Fredonia'),('USA','AR','Southern USA','Friendship'),('USA','AR','Southern USA','Fulton'),('USA','AR','Southern USA','Garfield'),('USA','AR','Southern USA','Garland'),('USA','AR','Southern USA','Garner'),('USA','AR','Southern USA','Gassville')," + 
                "('USA','AR','Southern USA','Gateway'),('USA','AR','Southern USA','Gentry'),('USA','AR','Southern USA','Georgetown'),('USA','AR','Southern USA','Gillett'),('USA','AR','Southern USA','Gillham'),('USA','AR','Southern USA','Gilmore'),('USA','AR','Southern USA','Glenwood'),('USA','AR','Southern USA','Goshen'),('USA','AR','Southern USA','Gosnell'),('USA','AR','Southern USA','Gould'),('USA','AR','Southern USA','Grady'),('USA','AR','Southern USA','Grannis'),('USA','AR','Southern USA','Gravette'),('USA','AR','Southern USA','Green Forest'),('USA','AR','Southern USA','Greenbrier'),('USA','AR','Southern USA','Greenland'),('USA','AR','Southern USA','Greenway'),('USA','AR','Southern USA','Greenwood'),('USA','AR','Southern USA','Greers Ferry'),('USA','AR','Southern USA','Griffithville'),('USA','AR','Southern USA','Grubbs'),('USA','AR','Southern USA','Gum Springs'),('USA','AR','Southern USA','Gurdon'),('USA','AR','Southern USA','Guy'),('USA','AR','Southern USA','Hackett'),('USA','AR','Southern USA','Hamburg'),('USA','AR','Southern USA','Hampton'),('USA','AR','Southern USA','Hardy'),('USA','AR','Southern USA','Harrell'),('USA','AR','Southern USA','Harrisburg'),('USA','AR','Southern USA','Harrison'),('USA','AR','Southern USA','Hartford'),('USA','AR','Southern USA','Hartman'),('USA','AR','Southern USA','Haskell'),('USA','AR','Southern USA','Hatfield'),('USA','AR','Southern USA','Havana'),('USA','AR','Southern USA','Haynes'),('USA','AR','Southern USA','Hazen'),('USA','AR','Southern USA','Heber Springs'),('USA','AR','Southern USA','Hector'),('USA','AR','Southern USA','Helena'),('USA','AR','Southern USA','Hermitage')," + 
                "('USA','AR','Southern USA','Hickory Ridge'),('USA','AR','Southern USA','Higden'),('USA','AR','Southern USA','Higginson'),('USA','AR','Southern USA','Highfill'),('USA','AR','Southern USA','Highland'),('USA','AR','Southern USA','Holland'),('USA','AR','Southern USA','Holly Grove'),('USA','AR','Southern USA','Hope'),('USA','AR','Southern USA','Horatio'),('USA','AR','Southern USA','Horseshoe Bend'),('USA','AR','Southern USA','Horseshoe Lake'),('USA','AR','Southern USA','Hot Springs'),('USA','AR','Southern USA','Hot Springs Village'),('USA','AR','Southern USA','Houston'),('USA','AR','Southern USA','Hoxie'),('USA','AR','Southern USA','Hughes'),('USA','AR','Southern USA','Humnoke'),('USA','AR','Southern USA','Humphrey'),('USA','AR','Southern USA','Hunter'),('USA','AR','Southern USA','Huntington'),('USA','AR','Southern USA','Huntsville'),('USA','AR','Southern USA','Huttig'),('USA','AR','Southern USA','Imboden'),('USA','AR','Southern USA','Jacksonport'),('USA','AR','Southern USA','Jacksonville'),('USA','AR','Southern USA','Jasper'),('USA','AR','Southern USA','Jennette'),('USA','AR','Southern USA','Jericho'),('USA','AR','Southern USA','Johnson'),('USA','AR','Southern USA','Joiner'),('USA','AR','Southern USA','Jonesboro'),('USA','AR','Southern USA','Judsonia'),('USA','AR','Southern USA','Junction City'),('USA','AR','Southern USA','Keiser'),('USA','AR','Southern USA','Kensett'),('USA','AR','Southern USA','Keo'),('USA','AR','Southern USA','Kibler'),('USA','AR','Southern USA','Kingsland'),('USA','AR','Southern USA','Knobel'),('USA','AR','Southern USA','Knoxville'),('USA','AR','Southern USA','Lafe')," + 
                "('USA','AR','Southern USA','Lake City'),('USA','AR','Southern USA','Lake View'),('USA','AR','Southern USA','Lake Village'),('USA','AR','Southern USA','Lakeview'),('USA','AR','Southern USA','Lamar'),('USA','AR','Southern USA','Lavaca'),('USA','AR','Southern USA','Leachville'),('USA','AR','Southern USA','Lead Hill'),('USA','AR','Southern USA','Leola'),('USA','AR','Southern USA','Lepanto'),('USA','AR','Southern USA','Leslie'),('USA','AR','Southern USA','Letona'),('USA','AR','Southern USA','Lewisville'),('USA','AR','Southern USA','Lexa'),('USA','AR','Southern USA','Lincoln'),('USA','AR','Southern USA','Little Flock'),('USA','AR','Southern USA','Little Rock'),('USA','AR','Southern USA','Lockesburg'),('USA','AR','Southern USA','London'),('USA','AR','Southern USA','Lonoke'),('USA','AR','Southern USA','Louann'),('USA','AR','Southern USA','Lowell'),('USA','AR','Southern USA','Luxora'),('USA','AR','Southern USA','Lynn'),('USA','AR','Southern USA','Madison'),('USA','AR','Southern USA','Magazine'),('USA','AR','Southern USA','Magness'),('USA','AR','Southern USA','Magnolia'),('USA','AR','Southern USA','Malvern'),('USA','AR','Southern USA','Mammoth Spring'),('USA','AR','Southern USA','Manila'),('USA','AR','Southern USA','Mansfield'),('USA','AR','Southern USA','Marianna'),('USA','AR','Southern USA','Marion'),('USA','AR','Southern USA','Marked Tree'),('USA','AR','Southern USA','Marmaduke'),('USA','AR','Southern USA','Marshall'),('USA','AR','Southern USA','Marvell'),('USA','AR','Southern USA','Maumelle'),('USA','AR','Southern USA','Mayflower'),('USA','AR','Southern USA','Maynard'),('USA','AR','Southern USA','McCrory')," + 
                "('USA','AR','Southern USA','McDougal'),('USA','AR','Southern USA','McGehee'),('USA','AR','Southern USA','McNeil'),('USA','AR','Southern USA','McRae'),('USA','AR','Southern USA','Melbourne'),('USA','AR','Southern USA','Mena'),('USA','AR','Southern USA','Menifee'),('USA','AR','Southern USA','Midland'),('USA','AR','Southern USA','Midway'),('USA','AR','Southern USA','Mineral Springs'),('USA','AR','Southern USA','Minturn'),('USA','AR','Southern USA','Mitchellville'),('USA','AR','Southern USA','Monette'),('USA','AR','Southern USA','Monticello'),('USA','AR','Southern USA','Montrose'),('USA','AR','Southern USA','Moorefield'),('USA','AR','Southern USA','Moro'),('USA','AR','Southern USA','Morrilton'),('USA','AR','Southern USA','Mount Ida'),('USA','AR','Southern USA','Mount Pleasant'),('USA','AR','Southern USA','Mount Vernon'),('USA','AR','Southern USA','Mountain Home'),('USA','AR','Southern USA','Mountain Pine'),('USA','AR','Southern USA','Mountain View'),('USA','AR','Southern USA','Mountainburg'),('USA','AR','Southern USA','Mulberry'),('USA','AR','Southern USA','Murfeesboro'),('USA','AR','Southern USA','Nashville'),('USA','AR','Southern USA','Newark'),('USA','AR','Southern USA','Newport'),('USA','AR','Southern USA','Norfork'),('USA','AR','Southern USA','Norman'),('USA','AR','Southern USA','Norphlet'),('USA','AR','Southern USA','North Little Rock'),('USA','AR','Southern USA','Oak Grove'),('USA','AR','Southern USA','Oak Grove Heights'),('USA','AR','Southern USA','Oden'),('USA','AR','Southern USA','Ogden'),('USA','AR','Southern USA','Oil Trough'),('USA','AR','Southern USA','Okolona'),('USA','AR','Southern USA','Ola')," + 
                "('USA','AR','Southern USA','Omaha'),('USA','AR','Southern USA','Oppelo'),('USA','AR','Southern USA','Osceola'),('USA','AR','Southern USA','Oxford'),('USA','AR','Southern USA','Ozark'),('USA','AR','Southern USA','O\'Kean'),('USA','AR','Southern USA','Palestine'),('USA','AR','Southern USA','Pangburn'),('USA','AR','Southern USA','Paragould'),('USA','AR','Southern USA','Paris'),('USA','AR','Southern USA','Parkdale'),('USA','AR','Southern USA','Parkin'),('USA','AR','Southern USA','Patterson'),('USA','AR','Southern USA','Pea Ridge'),('USA','AR','Southern USA','Peach Orchard'),('USA','AR','Southern USA','Perla'),('USA','AR','Southern USA','Perry'),('USA','AR','Southern USA','Perrytown'),('USA','AR','Southern USA','Perryville'),('USA','AR','Southern USA','Piggott'),('USA','AR','Southern USA','Pindall'),('USA','AR','Southern USA','Pine Bluff'),('USA','AR','Southern USA','Pineville'),('USA','AR','Southern USA','Plainview'),('USA','AR','Southern USA','Pleasant Plains'),('USA','AR','Southern USA','Plumerville'),('USA','AR','Southern USA','Pocahontas'),('USA','AR','Southern USA','Pollard'),('USA','AR','Southern USA','Portia'),('USA','AR','Southern USA','Portland'),('USA','AR','Southern USA','Pottsville'),('USA','AR','Southern USA','Poyen'),('USA','AR','Southern USA','Praire Grove'),('USA','AR','Southern USA','Prattsville'),('USA','AR','Southern USA','Prescott'),('USA','AR','Southern USA','Pyatt'),('USA','AR','Southern USA','Quitman'),('USA','AR','Southern USA','Ratcliff'),('USA','AR','Southern USA','Ravenden'),('USA','AR','Southern USA','Ravenden Springs'),('USA','AR','Southern USA','Rector')," + 
                "('USA','AR','Southern USA','Redfield'),('USA','AR','Southern USA','Reed'),('USA','AR','Southern USA','Reyno'),('USA','AR','Southern USA','Rison'),('USA','AR','Southern USA','Rockport'),('USA','AR','Southern USA','Roe'),('USA','AR','Southern USA','Rogers'),('USA','AR','Southern USA','Rondo'),('USA','AR','Southern USA','Rose Bud'),('USA','AR','Southern USA','Rosston'),('USA','AR','Southern USA','Rudy'),('USA','AR','Southern USA','Russell'),('USA','AR','Southern USA','Russellville'),('USA','AR','Southern USA','Salem'),('USA','AR','Southern USA','Salesville'),('USA','AR','Southern USA','Scranton'),('USA','AR','Southern USA','Searcy'),('USA','AR','Southern USA','Sedgwick'),('USA','AR','Southern USA','Shannon Hills'),('USA','AR','Southern USA','Sheridan'),('USA','AR','Southern USA','Sherwood'),('USA','AR','Southern USA','Shirley'),('USA','AR','Southern USA','Sidney'),('USA','AR','Southern USA','Siloam Springs'),('USA','AR','Southern USA','Smackover'),('USA','AR','Southern USA','South Lead Hill'),('USA','AR','Southern USA','Sparkman'),('USA','AR','Southern USA','Springdale'),('USA','AR','Southern USA','Stamps'),('USA','AR','Southern USA','Star City'),('USA','AR','Southern USA','Stephens'),('USA','AR','Southern USA','Strawberry'),('USA','AR','Southern USA','Strong'),('USA','AR','Southern USA','Stuttgart'),('USA','AR','Southern USA','St. Charles'),('USA','AR','Southern USA','St. Francis'),('USA','AR','Southern USA','St. Joe'),('USA','AR','Southern USA','St. Paul'),('USA','AR','Southern USA','Subiaco'),('USA','AR','Southern USA','Success'),('USA','AR','Southern USA','Sulphur Rock')," + 
                "('USA','AR','Southern USA','Sulphur Springs'),('USA','AR','Southern USA','Summit'),('USA','AR','Southern USA','Sunset'),('USA','AR','Southern USA','Swifton'),('USA','AR','Southern USA','Taylor'),('USA','AR','Southern USA','Texarkana'),('USA','AR','Southern USA','Thornton'),('USA','AR','Southern USA','Tillar'),('USA','AR','Southern USA','Tollette'),('USA','AR','Southern USA','Tontitown'),('USA','AR','Southern USA','Traskwood'),('USA','AR','Southern USA','Trumann'),('USA','AR','Southern USA','Tuckerman'),('USA','AR','Southern USA','Tull'),('USA','AR','Southern USA','Tupelo'),('USA','AR','Southern USA','Turrell'),('USA','AR','Southern USA','Twin Groves'),('USA','AR','Southern USA','Tyronza'),('USA','AR','Southern USA','Ulm'),('USA','AR','Southern USA','Valley Springs'),('USA','AR','Southern USA','Van Buren'),('USA','AR','Southern USA','Vilonia'),('USA','AR','Southern USA','Viola'),('USA','AR','Southern USA','Wabbaseka'),('USA','AR','Southern USA','Waldo'),('USA','AR','Southern USA','Waldron'),('USA','AR','Southern USA','Walnut Ridge'),('USA','AR','Southern USA','Ward'),('USA','AR','Southern USA','Warren'),('USA','AR','Southern USA','Washington'),('USA','AR','Southern USA','Watson'),('USA','AR','Southern USA','Weiner'),('USA','AR','Southern USA','West Fork'),('USA','AR','Southern USA','West Memphis'),('USA','AR','Southern USA','West Point'),('USA','AR','Southern USA','Western Grove'),('USA','AR','Southern USA','Wheatley'),('USA','AR','Southern USA','White Hall'),('USA','AR','Southern USA','Wickes'),('USA','AR','Southern USA','Widener'),('USA','AR','Southern USA','Willisville')," + 
                "('USA','AR','Southern USA','Wilmar'),('USA','AR','Southern USA','Wilmot'),('USA','AR','Southern USA','Wilson'),('USA','AR','Southern USA','Wilton'),('USA','AR','Southern USA','Winchester'),('USA','AR','Southern USA','Winslow'),('USA','AR','Southern USA','Winthrop'),('USA','AR','Southern USA','Wooster'),('USA','AR','Southern USA','Wrightsville'),('USA','AR','Southern USA','Wynne'),('USA','AR','Southern USA','Yellville'),('USA','AR','Southern USA','Zinc')");
            //California
            db.ExecuteSql("Insert into northAmerica Values('USA','CA','Western USA','Adelanto'),('USA','CA','Western USA','Agoura Hills'),('USA','CA','Western USA','Alameda'),('USA','CA','Western USA','Albany'),('USA','CA','Western USA','Alhambra'),('USA','CA','Western USA','Aliso Viejo'),('USA','CA','Western USA','Alturas'),('USA','CA','Western USA','Amador City'),('USA','CA','Western USA','American Canyon'),('USA','CA','Western USA','Anaheim'),('USA','CA','Western USA','Anderson'),('USA','CA','Western USA','Angels Camp'),('USA','CA','Western USA','Antioch'),('USA','CA','Western USA','Apple Valley'),('USA','CA','Western USA','Arcadia'),('USA','CA','Western USA','Arcata'),('USA','CA','Western USA','Arroyo Grande'),('USA','CA','Western USA','Artesia'),('USA','CA','Western USA','Arvin'),('USA','CA','Western USA','Atascadero'),('USA','CA','Western USA','Atherton'),('USA','CA','Western USA','Atwater'),('USA','CA','Western USA','Auburn'),('USA','CA','Western USA','Avalon'),('USA','CA','Western USA','Avenal'),('USA','CA','Western USA','Azusa'),('USA','CA','Western USA','Bakersfield'),('USA','CA','Western USA','Baldwin Park'),('USA','CA','Western USA','Banning'),('USA','CA','Western USA','Barstow'),('USA','CA','Western USA','Beaumont'),('USA','CA','Western USA','Bell'),('USA','CA','Western USA','Bell Gardens'),('USA','CA','Western USA','Bellflower'),('USA','CA','Western USA','Belmont'),('USA','CA','Western USA','Belvedere'),('USA','CA','Western USA','Benicia'),('USA','CA','Western USA','Berkeley'),('USA','CA','Western USA','Beverly Hills'),('USA','CA','Western USA','Big Bear Lake'),('USA','CA','Western USA','Biggs')," + 
                "('USA','CA','Western USA','Bishop'),('USA','CA','Western USA','Blue Lake'),('USA','CA','Western USA','Blythe'),('USA','CA','Western USA','Bradbury'),('USA','CA','Western USA','Brawley'),('USA','CA','Western USA','Brea'),('USA','CA','Western USA','Brentwood'),('USA','CA','Western USA','Brisbane'),('USA','CA','Western USA','Buellton'),('USA','CA','Western USA','Buena Park'),('USA','CA','Western USA','Burbank'),('USA','CA','Western USA','Burlingame'),('USA','CA','Western USA','Calabasas'),('USA','CA','Western USA','California City'),('USA','CA','Western USA','Calimesa'),('USA','CA','Western USA','Calipatria'),('USA','CA','Western USA','Calistoga'),('USA','CA','Western USA','Camarillo'),('USA','CA','Western USA','Campbell'),('USA','CA','Western USA','Canyon Lake'),('USA','CA','Western USA','Capitola'),('USA','CA','Western USA','Carlsbad'),('USA','CA','Western USA','Carmel-by-the-Sea'),('USA','CA','Western USA','Carpinteria'),('USA','CA','Western USA','Carson'),('USA','CA','Western USA','Cathedral City'),('USA','CA','Western USA','Ceres'),('USA','CA','Western USA','Cerritos'),('USA','CA','Western USA','Chico'),('USA','CA','Western USA','Chino'),('USA','CA','Western USA','Chino Hills'),('USA','CA','Western USA','Chowchilla'),('USA','CA','Western USA','Chula Vista'),('USA','CA','Western USA','Citrus Heights'),('USA','CA','Western USA','Claremont'),('USA','CA','Western USA','Clayton'),('USA','CA','Western USA','Clearlake'),('USA','CA','Western USA','Cloverdale'),('USA','CA','Western USA','Clovis'),('USA','CA','Western USA','Coachella'),('USA','CA','Western USA','Coalinga'),('USA','CA','Western USA','Colfax')," + 
                "('USA','CA','Western USA','Colma'),('USA','CA','Western USA','Colton'),('USA','CA','Western USA','Colusa'),('USA','CA','Western USA','Commerce'),('USA','CA','Western USA','Compton'),('USA','CA','Western USA','Concord'),('USA','CA','Western USA','Corcoran'),('USA','CA','Western USA','Corning'),('USA','CA','Western USA','Corona'),('USA','CA','Western USA','Coronado'),('USA','CA','Western USA','Corte Madera'),('USA','CA','Western USA','Costa Mesa'),('USA','CA','Western USA','Cotati'),('USA','CA','Western USA','Covina'),('USA','CA','Western USA','Crescent City'),('USA','CA','Western USA','Cudahy'),('USA','CA','Western USA','Culver City'),('USA','CA','Western USA','Cupertino'),('USA','CA','Western USA','Cypress'),('USA','CA','Western USA','Daly City'),('USA','CA','Western USA','Dana Point'),('USA','CA','Western USA','Danville'),('USA','CA','Western USA','Davis'),('USA','CA','Western USA','Del Mar'),('USA','CA','Western USA','Del Rey Oaks'),('USA','CA','Western USA','Delano'),('USA','CA','Western USA','Desert Hot Springs'),('USA','CA','Western USA','Diamond Bar'),('USA','CA','Western USA','Dinuba'),('USA','CA','Western USA','Dixon'),('USA','CA','Western USA','Dorris'),('USA','CA','Western USA','Dos Palos'),('USA','CA','Western USA','Downey'),('USA','CA','Western USA','Duarte'),('USA','CA','Western USA','Dublin'),('USA','CA','Western USA','Dunsmuir'),('USA','CA','Western USA','East Palo Alto'),('USA','CA','Western USA','Eastvale'),('USA','CA','Western USA','El Cajon'),('USA','CA','Western USA','El Centro'),('USA','CA','Western USA','El Cerrito'),('USA','CA','Western USA','El Monte')," + 
                "('USA','CA','Western USA','El Segundo'),('USA','CA','Western USA','Elk Grove'),('USA','CA','Western USA','Emeryville'),('USA','CA','Western USA','Encinitas'),('USA','CA','Western USA','Escalon'),('USA','CA','Western USA','Escondido'),('USA','CA','Western USA','Etna'),('USA','CA','Western USA','Eureka'),('USA','CA','Western USA','Exeter'),('USA','CA','Western USA','Fairfax'),('USA','CA','Western USA','Fairfield'),('USA','CA','Western USA','Farmersville'),('USA','CA','Western USA','Ferndale'),('USA','CA','Western USA','Fillmore'),('USA','CA','Western USA','Firebaugh'),('USA','CA','Western USA','Folsom'),('USA','CA','Western USA','Fontana'),('USA','CA','Western USA','Fort Bragg'),('USA','CA','Western USA','Fort Jones'),('USA','CA','Western USA','Fortuna'),('USA','CA','Western USA','Foster City'),('USA','CA','Western USA','Fountain Valley'),('USA','CA','Western USA','Fowler'),('USA','CA','Western USA','Fremont'),('USA','CA','Western USA','Fresno'),('USA','CA','Western USA','Fullerton'),('USA','CA','Western USA','Galt'),('USA','CA','Western USA','Garden Cove'),('USA','CA','Western USA','Gardena'),('USA','CA','Western USA','Gilroy'),('USA','CA','Western USA','Glendale'),('USA','CA','Western USA','Glendora'),('USA','CA','Western USA','Goleta'),('USA','CA','Western USA','Gonzales'),('USA','CA','Western USA','Grand Terrace'),('USA','CA','Western USA','Grass Valley'),('USA','CA','Western USA','Greenfield'),('USA','CA','Western USA','Gridley'),('USA','CA','Western USA','Grover Beach'),('USA','CA','Western USA','Guadalupe'),('USA','CA','Western USA','Gustine'),('USA','CA','Western USA','Half Moon Bay')," + 
                "('USA','CA','Western USA','Hanford'),('USA','CA','Western USA','Hawaiian Gardens'),('USA','CA','Western USA','Hawthorne'),('USA','CA','Western USA','Hayward'),('USA','CA','Western USA','Heraldsburg'),('USA','CA','Western USA','Hemet'),('USA','CA','Western USA','Hercules'),('USA','CA','Western USA','Hermosa Beach'),('USA','CA','Western USA','Hesperia'),('USA','CA','Western USA','Hidden Hills'),('USA','CA','Western USA','Highland'),('USA','CA','Western USA','Hillborough'),('USA','CA','Western USA','Hollister'),('USA','CA','Western USA','Holtville'),('USA','CA','Western USA','Hughson'),('USA','CA','Western USA','Huntington Beach'),('USA','CA','Western USA','Huntington Park'),('USA','CA','Western USA','Huron'),('USA','CA','Western USA','Imperial'),('USA','CA','Western USA','Imperial Beach'),('USA','CA','Western USA','Imperial Wells'),('USA','CA','Western USA','Indio'),('USA','CA','Western USA','Industry'),('USA','CA','Western USA','Inglewood'),('USA','CA','Western USA','Ione'),('USA','CA','Western USA','Irvine'),('USA','CA','Western USA','Irwindale'),('USA','CA','Western USA','Isleton'),('USA','CA','Western USA','Jackson'),('USA','CA','Western USA','Jurupa Valley'),('USA','CA','Western USA','Kerman'),('USA','CA','Western USA','King City'),('USA','CA','Western USA','Kingsburg'),('USA','CA','Western USA','La Canada Flintridge'),('USA','CA','Western USA','La Habra'),('USA','CA','Western USA','La Habra Heights'),('USA','CA','Western USA','La Mesa'),('USA','CA','Western USA','La Mirada'),('USA','CA','Western USA','La Palma'),('USA','CA','Western USA','La Puente'),('USA','CA','Western USA','La Quinta')," + 
                "('USA','CA','Western USA','La Verne'),('USA','CA','Western USA','Lafayette'),('USA','CA','Western USA','Laguna Beach'),('USA','CA','Western USA','Laguna Hills'),('USA','CA','Western USA','Laguna Niguel'),('USA','CA','Western USA','Laguna Woods'),('USA','CA','Western USA','Lake Elsinore'),('USA','CA','Western USA','Lake Forest'),('USA','CA','Western USA','Lakeport'),('USA','CA','Western USA','Lakewood'),('USA','CA','Western USA','Lancaster'),('USA','CA','Western USA','Larkspur'),('USA','CA','Western USA','Lathrop'),('USA','CA','Western USA','Lawndale'),('USA','CA','Western USA','Lemon Grove'),('USA','CA','Western USA','Lemoore'),('USA','CA','Western USA','Lincoln'),('USA','CA','Western USA','Lindsay'),('USA','CA','Western USA','Live Oak'),('USA','CA','Western USA','Livermore'),('USA','CA','Western USA','Livingston'),('USA','CA','Western USA','Lodi'),('USA','CA','Western USA','Loma Linda'),('USA','CA','Western USA','Lomita'),('USA','CA','Western USA','Lompoc'),('USA','CA','Western USA','Long Beach'),('USA','CA','Western USA','Loomis'),('USA','CA','Western USA','Los Altos'),('USA','CA','Western USA','Los Altos Hills'),('USA','CA','Western USA','Los Angeles'),('USA','CA','Western USA','Los Banos'),('USA','CA','Western USA','Los Gatos'),('USA','CA','Western USA','Loyalton'),('USA','CA','Western USA','Lynwood'),('USA','CA','Western USA','Madera'),('USA','CA','Western USA','Malibu'),('USA','CA','Western USA','Mammoth Lakes'),('USA','CA','Western USA','Manhattan Beach'),('USA','CA','Western USA','Manteca'),('USA','CA','Western USA','Maricopa'),('USA','CA','Western USA','Marina'),('USA','CA','Western USA','Martinez')," + 
                "('USA','CA','Western USA','Marysville'),('USA','CA','Western USA','Maywood'),('USA','CA','Western USA','McFarland'),('USA','CA','Western USA','Mendota'),('USA','CA','Western USA','Menifee'),('USA','CA','Western USA','Menlo Park'),('USA','CA','Western USA','Merced'),('USA','CA','Western USA','Mill Valley'),('USA','CA','Western USA','Millbrae'),('USA','CA','Western USA','Milpitas'),('USA','CA','Western USA','Mission Viejo'),('USA','CA','Western USA','Modesto'),('USA','CA','Western USA','Monrovia'),('USA','CA','Western USA','Montague'),('USA','CA','Western USA','Montclair'),('USA','CA','Western USA','Monte Sereno'),('USA','CA','Western USA','Montebello'),('USA','CA','Western USA','Monterey'),('USA','CA','Western USA','Monterey Park'),('USA','CA','Western USA','Moorpark'),('USA','CA','Western USA','Moraga'),('USA','CA','Western USA','Moreno Valley'),('USA','CA','Western USA','Morgan Hill'),('USA','CA','Western USA','Morro Bay'),('USA','CA','Western USA','Mount Shasta'),('USA','CA','Western USA','Mountain View'),('USA','CA','Western USA','Murrieta'),('USA','CA','Western USA','Napa'),('USA','CA','Western USA','National City'),('USA','CA','Western USA','Needles'),('USA','CA','Western USA','Nevada City'),('USA','CA','Western USA','Newark'),('USA','CA','Western USA','Newman'),('USA','CA','Western USA','Newport Beach'),('USA','CA','Western USA','Norco'),('USA','CA','Western USA','Norwalk'),('USA','CA','Western USA','Novato'),('USA','CA','Western USA','Oakdale'),('USA','CA','Western USA','Oakland'),('USA','CA','Western USA','Oakley'),('USA','CA','Western USA','Oceanside'),('USA','CA','Western USA','Ojai')," + 
                "('USA','CA','Western USA','Ontario'),('USA','CA','Western USA','Orange'),('USA','CA','Western USA','Orange Cove'),('USA','CA','Western USA','Orinda'),('USA','CA','Western USA','Orland'),('USA','CA','Western USA','Oroville'),('USA','CA','Western USA','Oxnard'),('USA','CA','Western USA','Pacific Grove'),('USA','CA','Western USA','Pacifica'),('USA','CA','Western USA','Palm Desert'),('USA','CA','Western USA','Palm Springs'),('USA','CA','Western USA','Palmdale'),('USA','CA','Western USA','Palo Alto'),('USA','CA','Western USA','Palos Verdes Estates'),('USA','CA','Western USA','Paradise'),('USA','CA','Western USA','Paramount'),('USA','CA','Western USA','Parlier'),('USA','CA','Western USA','Pasadena'),('USA','CA','Western USA','Paso Robles'),('USA','CA','Western USA','Patterson'),('USA','CA','Western USA','Perris'),('USA','CA','Western USA','Petaluma'),('USA','CA','Western USA','Pico Rivera'),('USA','CA','Western USA','Piedmont'),('USA','CA','Western USA','Pinole'),('USA','CA','Western USA','Pismo Beach'),('USA','CA','Western USA','Pittsburg'),('USA','CA','Western USA','Placentia'),('USA','CA','Western USA','Placerville'),('USA','CA','Western USA','Pleasant Hill'),('USA','CA','Western USA','Pleasanton'),('USA','CA','Western USA','Plymouth'),('USA','CA','Western USA','Point Arena'),('USA','CA','Western USA','Pomona'),('USA','CA','Western USA','Port Hueneme'),('USA','CA','Western USA','Porterville'),('USA','CA','Western USA','Portola'),('USA','CA','Western USA','Portola Valley'),('USA','CA','Western USA','Poway'),('USA','CA','Western USA','Rancho Cordova'),('USA','CA','Western USA','Rancho Cucamonga')," + 
                "('USA','CA','Western USA','Rancho Mirage'),('USA','CA','Western USA','Rancho Palos Verdes'),('USA','CA','Western USA','Rancho Santa Margarita'),('USA','CA','Western USA','Red Bluff'),('USA','CA','Western USA','Redding'),('USA','CA','Western USA','Redlands'),('USA','CA','Western USA','Redondo Beach'),('USA','CA','Western USA','Redwood City'),('USA','CA','Western USA','Reedley'),('USA','CA','Western USA','Rialto'),('USA','CA','Western USA','Richmond'),('USA','CA','Western USA','Ridgecrest'),('USA','CA','Western USA','Rio Dell'),('USA','CA','Western USA','Rio Vista'),('USA','CA','Western USA','Ripon'),('USA','CA','Western USA','Riverbank'),('USA','CA','Western USA','Riverside'),('USA','CA','Western USA','Rocklin'),('USA','CA','Western USA','Rohnert Park'),('USA','CA','Western USA','Rolling Hills'),('USA','CA','Western USA','Rolling Hills Estates'),('USA','CA','Western USA','Rosemead'),('USA','CA','Western USA','Roseville'),('USA','CA','Western USA','Ross'),('USA','CA','Western USA','Sacramento'),('USA','CA','Western USA','Salinas'),('USA','CA','Western USA','San Anselmo'),('USA','CA','Western USA','San Bernardino'),('USA','CA','Western USA','San Bruno'),('USA','CA','Western USA','San Carlos'),('USA','CA','Western USA','San Clemente'),('USA','CA','Western USA','San Diego'),('USA','CA','Western USA','San Dimas'),('USA','CA','Western USA','San Fernando'),('USA','CA','Western USA','San Francisco'),('USA','CA','Western USA','San Gabriel'),('USA','CA','Western USA','San Jacinto'),('USA','CA','Western USA','San Joaquin'),('USA','CA','Western USA','San Jose'),('USA','CA','Western USA','San Juan Bautista')," + 
                "('USA','CA','Western USA','San Juan Capistrano'),('USA','CA','Western USA','San Leandro'),('USA','CA','Western USA','San Luis Obispo'),('USA','CA','Western USA','San Marcos'),('USA','CA','Western USA','San Marino'),('USA','CA','Western USA','San Mateo'),('USA','CA','Western USA','San Pablo'),('USA','CA','Western USA','San Rafael'),('USA','CA','Western USA','San Ramon'),('USA','CA','Western USA','Sand City'),('USA','CA','Western USA','Sanger'),('USA','CA','Western USA','Santa Ana'),('USA','CA','Western USA','Santa Barbara'),('USA','CA','Western USA','Santa Clara'),('USA','CA','Western USA','Santa Clarita'),('USA','CA','Western USA','Santa Cruz'),('USA','CA','Western USA','Santa Fe Springs'),('USA','CA','Western USA','Santa Maria'),('USA','CA','Western USA','Santa Monica'),('USA','CA','Western USA','Santa Paula'),('USA','CA','Western USA','Santa Rosa'),('USA','CA','Western USA','Santee'),('USA','CA','Western USA','Saratoga'),('USA','CA','Western USA','Sausalito'),('USA','CA','Western USA','Scotts Valley'),('USA','CA','Western USA','Seal Beach'),('USA','CA','Western USA','Seaside'),('USA','CA','Western USA','Sebastopol'),('USA','CA','Western USA','Selma'),('USA','CA','Western USA','Shafter'),('USA','CA','Western USA','Shasta Lake'),('USA','CA','Western USA','Sierra Madre'),('USA','CA','Western USA','Signal Hill'),('USA','CA','Western USA','Simi Valley'),('USA','CA','Western USA','Solana Beach'),('USA','CA','Western USA','Soledad'),('USA','CA','Western USA','Solvang'),('USA','CA','Western USA','Sonoma'),('USA','CA','Western USA','Sonora'),('USA','CA','Western USA','South El Monte')," + 
                "('USA','CA','Western USA','South Gate'),('USA','CA','Western USA','South Lake Tahoe'),('USA','CA','Western USA','South Pasadena'),('USA','CA','Western USA','South San Fransisco'),('USA','CA','Western USA','Stanton'),('USA','CA','Western USA','Stockton'),('USA','CA','Western USA','St. Helena'),('USA','CA','Western USA','Suisun City'),('USA','CA','Western USA','Sunnyvale'),('USA','CA','Western USA','Susanville'),('USA','CA','Western USA','Sutter Creek'),('USA','CA','Western USA','Taft'),('USA','CA','Western USA','Tehachapi'),('USA','CA','Western USA','Tehama'),('USA','CA','Western USA','Temecula'),('USA','CA','Western USA','Temple City'),('USA','CA','Western USA','Thousand Oaks'),('USA','CA','Western USA','Tiburon'),('USA','CA','Western USA','Torrance'),('USA','CA','Western USA','Tracy'),('USA','CA','Western USA','Trinidad'),('USA','CA','Western USA','Truckee'),('USA','CA','Western USA','Tulare'),('USA','CA','Western USA','Tulelake'),('USA','CA','Western USA','Turlock'),('USA','CA','Western USA','Tustin'),('USA','CA','Western USA','Twentynine Palms'),('USA','CA','Western USA','Ukiah'),('USA','CA','Western USA','Union City'),('USA','CA','Western USA','Upland'),('USA','CA','Western USA','Vacaville'),('USA','CA','Western USA','Vallejo'),('USA','CA','Western USA','Ventura'),('USA','CA','Western USA','Vernon'),('USA','CA','Western USA','Victorville'),('USA','CA','Western USA','Villa Park'),('USA','CA','Western USA','Visalia'),('USA','CA','Western USA','Vista'),('USA','CA','Western USA','Walnut'),('USA','CA','Western USA','Walnut Creek'),('USA','CA','Western USA','Wasco'),('USA','CA','Western USA','Waterford')," + 
                "('USA','CA','Western USA','Watsonville'),('USA','CA','Western USA','Weed'),('USA','CA','Western USA','West Covina'),('USA','CA','Western USA','West Hollyood'),('USA','CA','Western USA','West Sacramento'),('USA','CA','Western USA','Westlake Village'),('USA','CA','Western USA','Westminster'),('USA','CA','Western USA','Westmorland'),('USA','CA','Western USA','Wheatland'),('USA','CA','Western USA','Whittier'),('USA','CA','Western USA','Wildomar'),('USA','CA','Western USA','Williams'),('USA','CA','Western USA','Willits'),('USA','CA','Western USA','Willows'),('USA','CA','Western USA','Windsor'),('USA','CA','Western USA','Winters'),('USA','CA','Western USA','Woodlake'),('USA','CA','Western USA','Woodland'),('USA','CA','Western USA','Woodside'),('USA','CA','Western USA','Yorba Linda'),('USA','CA','Western USA','Yountville'),('USA','CA','Western USA','Yreka'),('USA','CA','Western USA','Yuba City'),('USA','CA','Western USA','Yucaipa'),('USA','CA','Western USA','Yucca Valley')");
            //Colorado
            db.ExecuteSql("Insert into northAmerica Values('USA','CO','Western USA','Aguilar'),('USA','CO','Western USA','Akron'),('USA','CO','Western USA','Alamosa'),('USA','CO','Western USA','Alma'),('USA','CO','Western USA','Antonito'),('USA','CO','Western USA','Arriba'),('USA','CO','Western USA','Arvada'),('USA','CO','Western USA','Aspen'),('USA','CO','Western USA','Ault'),('USA','CO','Western USA','Aurora'),('USA','CO','Western USA','Avon'),('USA','CO','Western USA','Basalt'),('USA','CO','Western USA','Bayfield'),('USA','CO','Western USA','Bennett'),('USA','CO','Western USA','Berthoud'),('USA','CO','Western USA','Bethune'),('USA','CO','Western USA','Black Hawk'),('USA','CO','Western USA','Blanca'),('USA','CO','Western USA','Blue River'),('USA','CO','Western USA','Boone'),('USA','CO','Western USA','Boulder'),('USA','CO','Western USA','Bow Mar'),('USA','CO','Western USA','Breckenridge'),('USA','CO','Western USA','Brighton'),('USA','CO','Western USA','Brookside'),('USA','CO','Western USA','Broomfield'),('USA','CO','Western USA','Brush'),('USA','CO','Western USA','Buena Vista'),('USA','CO','Western USA','Burlington'),('USA','CO','Western USA','Calhan'),('USA','CO','Western USA','Campo'),('USA','CO','Western USA','Carbondale'),('USA','CO','Western USA','Castle Pines'),('USA','CO','Western USA','Castle Rock'),('USA','CO','Western USA','Canon City'),('USA','CO','Western USA','Cedaredge'),('USA','CO','Western USA','Centennial'),('USA','CO','Western USA','Center'),('USA','CO','Western USA','Central City'),('USA','CO','Western USA','Cheraw'),('USA','CO','Western USA','Cherry Hills Village'),('USA','CO','Western USA','Cheyenne Wells')," + 
                "('USA','CO','Western USA','Coal Creek'),('USA','CO','Western USA','Cokedale'),('USA','CO','Western USA','Collbran'),('USA','CO','Western USA','Colorado Springs'),('USA','CO','Western USA','Columbine Valley'),('USA','CO','Western USA','Commerce City'),('USA','CO','Western USA','Cortez'),('USA','CO','Western USA','Craig'),('USA','CO','Western USA','Crawford'),('USA','CO','Western USA','Creede'),('USA','CO','Western USA','Crested Butte'),('USA','CO','Western USA','Crestone'),('USA','CO','Western USA','Cripple Creek'),('USA','CO','Western USA','Crook'),('USA','CO','Western USA','Crowley'),('USA','CO','Western USA','Dacono'),('USA','CO','Western USA','De Beque'),('USA','CO','Western USA','Deer Trail'),('USA','CO','Western USA','Del Norte'),('USA','CO','Western USA','Delta'),('USA','CO','Western USA','Denver'),('USA','CO','Western USA','Dillon'),('USA','CO','Western USA','Dinosaur'),('USA','CO','Western USA','Dolores'),('USA','CO','Western USA','Dove Creek'),('USA','CO','Western USA','Durango'),('USA','CO','Western USA','Eads'),('USA','CO','Western USA','Eagle'),('USA','CO','Western USA','Eaton'),('USA','CO','Western USA','Eckley'),('USA','CO','Western USA','Edgewater'),('USA','CO','Western USA','Elizabeth'),('USA','CO','Western USA','Empire'),('USA','CO','Western USA','Englewood'),('USA','CO','Western USA','Erie'),('USA','CO','Western USA','Estes Park'),('USA','CO','Western USA','Evans'),('USA','CO','Western USA','Fairplay'),('USA','CO','Western USA','Federal Heights'),('USA','CO','Western USA','Firestone'),('USA','CO','Western USA','Flagler'),('USA','CO','Western USA','Fleming'),('USA','CO','Western USA','Florence')," + 
                "('USA','CO','Western USA','Fort Collins'),('USA','CO','Western USA','Fort Lupton'),('USA','CO','Western USA','Fort Morgan'),('USA','CO','Western USA','Fountain'),('USA','CO','Western USA','Fowler'),('USA','CO','Western USA','Foxfield'),('USA','CO','Western USA','Fraser'),('USA','CO','Western USA','Frederick'),('USA','CO','Western USA','Frisco'),('USA','CO','Western USA','Fruita'),('USA','CO','Western USA','Garden City'),('USA','CO','Western USA','Genoa'),('USA','CO','Western USA','Georgetown'),('USA','CO','Western USA','Gilcrest'),('USA','CO','Western USA','Glendale'),('USA','CO','Western USA','Glenwood Springs'),('USA','CO','Western USA','Golden'),('USA','CO','Western USA','Granada'),('USA','CO','Western USA','Granby'),('USA','CO','Western USA','Grand Junction'),('USA','CO','Western USA','Grand Lake'),('USA','CO','Western USA','Greeley'),('USA','CO','Western USA','Green Mountain Falls'),('USA','CO','Western USA','Greenwood Village'),('USA','CO','Western USA','Grover'),('USA','CO','Western USA','Gunnison'),('USA','CO','Western USA','Gypsum'),('USA','CO','Western USA','Haxtun'),('USA','CO','Western USA','Hayden'),('USA','CO','Western USA','Hillrose'),('USA','CO','Western USA','Holly'),('USA','CO','Western USA','Holyoke'),('USA','CO','Western USA','Hooper'),('USA','CO','Western USA','Hot Sulphur Springs'),('USA','CO','Western USA','Hotchkiss'),('USA','CO','Western USA','Hudson'),('USA','CO','Western USA','Hugo'),('USA','CO','Western USA','Idaho Springs'),('USA','CO','Western USA','Ignacio'),('USA','CO','Western USA','Iliff'),('USA','CO','Western USA','Jamestown'),('USA','CO','Western USA','Johnstown')," + 
                "('USA','CO','Western USA','Julesburg'),('USA','CO','Western USA','Keenesburg'),('USA','CO','Western USA','Kersey'),('USA','CO','Western USA','Kiowa'),('USA','CO','Western USA','Kit Carson'),('USA','CO','Western USA','Kremmling'),('USA','CO','Western USA','La Jara'),('USA','CO','Western USA','La Junta'),('USA','CO','Western USA','La Veta'),('USA','CO','Western USA','Lafayette'),('USA','CO','Western USA','Lake City'),('USA','CO','Western USA','Lakewood'),('USA','CO','Western USA','Lamar'),('USA','CO','Western USA','Larkspur'),('USA','CO','Western USA','Las Animas'),('USA','CO','Western USA','LaSalle'),('USA','CO','Western USA','Leadville'),('USA','CO','Western USA','Limon'),('USA','CO','Western USA','Littleton'),('USA','CO','Western USA','Lochbuie'),('USA','CO','Western USA','Log Lane Village'),('USA','CO','Western USA','Lone Tree'),('USA','CO','Western USA','Longmont'),('USA','CO','Western USA','Louisville'),('USA','CO','Western USA','Loveland'),('USA','CO','Western USA','Lyons'),('USA','CO','Western USA','Manassa'),('USA','CO','Western USA','Mancos'),('USA','CO','Western USA','Manitou Springs'),('USA','CO','Western USA','Manzanola'),('USA','CO','Western USA','Marble'),('USA','CO','Western USA','Mead'),('USA','CO','Western USA','Meeker'),('USA','CO','Western USA','Merino'),('USA','CO','Western USA','Milliken'),('USA','CO','Western USA','Minturn'),('USA','CO','Western USA','Moffat'),('USA','CO','Western USA','Monte Vista'),('USA','CO','Western USA','Montrose'),('USA','CO','Western USA','Monument'),('USA','CO','Western USA','Morrison'),('USA','CO','Western USA','Mount Crested Butte')," + 
                "('USA','CO','Western USA','Mountain View'),('USA','CO','Western USA','Mountain Village'),('USA','CO','Western USA','Naturita'),('USA','CO','Western USA','Nederland'),('USA','CO','Western USA','New Castle'),('USA','CO','Western USA','Northglenn'),('USA','CO','Western USA','Norwood'),('USA','CO','Western USA','Nucla'),('USA','CO','Western USA','Nunn'),('USA','CO','Western USA','Oak Creek'),('USA','CO','Western USA','Olathe'),('USA','CO','Western USA','Olney Springs'),('USA','CO','Western USA','Ophir'),('USA','CO','Western USA','Orchard City'),('USA','CO','Western USA','Ordway'),('USA','CO','Western USA','Otis'),('USA','CO','Western USA','Ouray'),('USA','CO','Western USA','Ovid'),('USA','CO','Western USA','Pagosa Springs'),('USA','CO','Western USA','Palisade'),('USA','CO','Western USA','Palmer Lake'),('USA','CO','Western USA','Paonia'),('USA','CO','Western USA','Parachute'),('USA','CO','Western USA','Parker'),('USA','CO','Western USA','Peetz'),('USA','CO','Western USA','Pierce'),('USA','CO','Western USA','Platteville'),('USA','CO','Western USA','Poncha Springs'),('USA','CO','Western USA','Pritchett'),('USA','CO','Western USA','Pueblo'),('USA','CO','Western USA','Ramah'),('USA','CO','Western USA','Rangely'),('USA','CO','Western USA','Raymer'),('USA','CO','Western USA','Red Cliff'),('USA','CO','Western USA','Rico'),('USA','CO','Western USA','Ridgeway'),('USA','CO','Western USA','Rifle'),('USA','CO','Western USA','Rockvale'),('USA','CO','Western USA','Rocky Ford'),('USA','CO','Western USA','Romeo'),('USA','CO','Western USA','Rye'),('USA','CO','Western USA','Saguache'),('USA','CO','Western USA','Salida')," + 
                "('USA','CO','Western USA','San Luis'),('USA','CO','Western USA','Sanford'),('USA','CO','Western USA','Sedgwick'),('USA','CO','Western USA','Seibert'),('USA','CO','Western USA','Severance'),('USA','CO','Western USA','Sheridan'),('USA','CO','Western USA','Silt'),('USA','CO','Western USA','Silver Cliff'),('USA','CO','Western USA','Silver Plume'),('USA','CO','Western USA','Silverthorne'),('USA','CO','Western USA','Silverton'),('USA','CO','Western USA','Simla'),('USA','CO','Western USA','Snowmass Village'),('USA','CO','Western USA','South Fork'),('USA','CO','Western USA','Springfield'),('USA','CO','Western USA','Steamboat Springs'),('USA','CO','Western USA','Sterling'),('USA','CO','Western USA','Stratton'),('USA','CO','Western USA','Sugar City'),('USA','CO','Western USA','Superior'),('USA','CO','Western USA','Swink'),('USA','CO','Western USA','Telluride'),('USA','CO','Western USA','Thornton'),('USA','CO','Western USA','Timnath'),('USA','CO','Western USA','Trinidad'),('USA','CO','Western USA','Vail'),('USA','CO','Western USA','Victor'),('USA','CO','Western USA','Vilas'),('USA','CO','Western USA','Vona'),('USA','CO','Western USA','Walden'),('USA','CO','Western USA','Walsenburg'),('USA','CO','Western USA','Walsh'),('USA','CO','Western USA','Ward'),('USA','CO','Western USA','Wellington'),('USA','CO','Western USA','Westcliffe'),('USA','CO','Western USA','Westminster'),('USA','CO','Western USA','Wheat Ridge'),('USA','CO','Western USA','Wiggins'),('USA','CO','Western USA','Wiley'),('USA','CO','Western USA','Williamsburg'),('USA','CO','Western USA','Windsor'),('USA','CO','Western USA','Winter Park')," + 
                "('USA','CO','Western USA','Woodland Park'),('USA','CO','Western USA','Wray'),('USA','CO','Western USA','Yampa'),('USA','CO','Western USA','Yuma')");
            //Connecticut
            db.ExecuteSql("Insert into northAmerica Values('USA','CT','Northeastern USA','Ansonia'),('USA','CT','Northeastern USA','Bridgeport'),('USA','CT','Northeastern USA','Bristol'),('USA','CT','Northeastern USA','Danbury'),('USA','CT','Northeastern USA','Derby'),('USA','CT','Northeastern USA','East Hartford'),('USA','CT','Northeastern USA','Enfield'),('USA','CT','Northeastern USA','Fairfield'),('USA','CT','Northeastern USA','Greenwich'),('USA','CT','Northeastern USA','Groton'),('USA','CT','Northeastern USA','Hamden'),('USA','CT','Northeastern USA','Hartford'),('USA','CT','Northeastern USA','Manchester'),('USA','CT','Northeastern USA','Meriden'),('USA','CT','Northeastern USA','Middletown'),('USA','CT','Northeastern USA','Milford'),('USA','CT','Northeastern USA','New Britain'),('USA','CT','Northeastern USA','New Haven'),('USA','CT','Northeastern USA','New London'),('USA','CT','Northeastern USA','Norwalk'),('USA','CT','Northeastern USA','Norwich'),('USA','CT','Northeastern USA','Old Saybrook'),('USA','CT','Northeastern USA','Shelton'),('USA','CT','Northeastern USA','Southington'),('USA','CT','Northeastern USA','Stamford'),('USA','CT','Northeastern USA','Stratford'),('USA','CT','Northeastern USA','Torrington'),('USA','CT','Northeastern USA','Union'),('USA','CT','Northeastern USA','Wallingford'),('USA','CT','Northeastern USA','Waterbury'),('USA','CT','Northeastern USA','West Hartford'),('USA','CT','Northeastern USA','West Haven'),('USA','CT','Northeastern USA','Winchester'),('USA','CT','Northeastern USA','Winsted')");
            //Delaware
            db.ExecuteSql("Insert into northAmerica Values('USA','DE','Southern USA','Arden'),('USA','DE','Southern USA','Ardencroft'),('USA','DE','Southern USA','Ardentown'),('USA','DE','Southern USA','Bellefonte'),('USA','DE','Southern USA','Bethany Beach'),('USA','DE','Southern USA','Bethel'),('USA','DE','Southern USA','Blades'),('USA','DE','Southern USA','Bowers'),('USA','DE','Southern USA','Bridgeville'),('USA','DE','Southern USA','Camden'),('USA','DE','Southern USA','Cheswold'),('USA','DE','Southern USA','Clayton'),('USA','DE','Southern USA','Dagsboro'),('USA','DE','Southern USA','Delaware City'),('USA','DE','Southern USA','Delmar'),('USA','DE','Southern USA','Dewey Beach'),('USA','DE','Southern USA','Dover'),('USA','DE','Southern USA','Ellendale'),('USA','DE','Southern USA','Elsmere'),('USA','DE','Southern USA','Farmington'),('USA','DE','Southern USA','Felton'),('USA','DE','Southern USA','Fenwick Island'),('USA','DE','Southern USA','Frankford'),('USA','DE','Southern USA','Frederica'),('USA','DE','Southern USA','Georgetown'),('USA','DE','Southern USA','Greenwood'),('USA','DE','Southern USA','Harrington'),('USA','DE','Southern USA','Hartly'),('USA','DE','Southern USA','Henlopen Acres'),('USA','DE','Southern USA','Houston'),('USA','DE','Southern USA','Kenton'),('USA','DE','Southern USA','Laurel'),('USA','DE','Southern USA','Leipsic'),('USA','DE','Southern USA','Lewes'),('USA','DE','Southern USA','Little Creek'),('USA','DE','Southern USA','Magnolia'),('USA','DE','Southern USA','Middletown'),('USA','DE','Southern USA','Milford'),('USA','DE','Southern USA','Millsboro'),('USA','DE','Southern USA','Millville')," + 
                "('USA','DE','Southern USA','Milton'),('USA','DE','Southern USA','New Castle'),('USA','DE','Southern USA','Newark'),('USA','DE','Southern USA','Newport'),('USA','DE','Southern USA','Ocean View'),('USA','DE','Southern USA','Odessa'),('USA','DE','Southern USA','Rehoboth Beach'),('USA','DE','Southern USA','Seaford'),('USA','DE','Southern USA','Selbyville'),('USA','DE','Southern USA','Slaughter Beach'),('USA','DE','Southern USA','Smyrna'),('USA','DE','Southern USA','South Bethany'),('USA','DE','Southern USA','Townsend'),('USA','DE','Southern USA','Viola'),('USA','DE','Southern USA','Willmington'),('USA','DE','Southern USA','Woodside'),('USA','DE','Southern USA','Wyoming')");
            //Florida
            db.ExecuteSql("Insert into northAmerica Values('USA','FL','Southern USA','Alachua'),('USA','FL','Southern USA','Alford'),('USA','FL','Southern USA','Altamonte Springs'),('USA','FL','Southern USA','Altha'),('USA','FL','Southern USA','Anna Maria'),('USA','FL','Southern USA','Apalachicola'),('USA','FL','Southern USA','Apopka'),('USA','FL','Southern USA','Arcadia'),('USA','FL','Southern USA','Archer'),('USA','FL','Southern USA','Astatula'),('USA','FL','Southern USA','Atlantic Beach'),('USA','FL','Southern USA','Atlantis'),('USA','FL','Southern USA','Auburndale'),('USA','FL','Southern USA','Aventura'),('USA','FL','Southern USA','Avon Park'),('USA','FL','Southern USA','Bal Harbour'),('USA','FL','Southern USA','Baldwin'),('USA','FL','Southern USA','Bartow'),('USA','FL','Southern USA','Bascom'),('USA','FL','Southern USA','Bay Harbor Islands'),('USA','FL','Southern USA','Bell'),('USA','FL','Southern USA','Belle Glade'),('USA','FL','Southern USA','Belle Isle'),('USA','FL','Southern USA','Belleair'),('USA','FL','Southern USA','Belleair Beach'),('USA','FL','Southern USA','Belleair Bluffs'),('USA','FL','Southern USA','Belleair Shore'),('USA','FL','Southern USA','Belleview'),('USA','FL','Southern USA','Beverly Beach'),('USA','FL','Southern USA','Biscayne Park'),('USA','FL','Southern USA','Blountstown'),('USA','FL','Southern USA','Boca Raton'),('USA','FL','Southern USA','Bonifay'),('USA','FL','Southern USA','Bonita Springs'),('USA','FL','Southern USA','Bowling Green'),('USA','FL','Southern USA','Boynton Beach'),('USA','FL','Southern USA','Bradenton Beach'),('USA','FL','Southern USA','Bradenton')," + 
                "('USA','FL','Southern USA','Branford'),('USA','FL','Southern USA','Briny Breezes'),('USA','FL','Southern USA','Bristol'),('USA','FL','Southern USA','Bronson'),('USA','FL','Southern USA','Brooker'),('USA','FL','Southern USA','Brooksville'),('USA','FL','Southern USA','Bunnell'),('USA','FL','Southern USA',''),('USA','FL','Southern USA','Bushnell'),('USA','FL','Southern USA','Callahan'),('USA','FL','Southern USA','Callaway'),('USA','FL','Southern USA','Campbellton'),('USA','FL','Southern USA','Cape Canaveral'),('USA','FL','Southern USA','Cape Coral'),('USA','FL','Southern USA','Carrabelle'),('USA','FL','Southern USA','Caryville'),('USA','FL','Southern USA','Casselberry'),('USA','FL','Southern USA','Cedar Key'),('USA','FL','Southern USA','Center Hill'),('USA','FL','Southern USA','Century'),('USA','FL','Southern USA','Chattahoochee'),('USA','FL','Southern USA','Chiefland'),('USA','FL','Southern USA','Chipley'),('USA','FL','Southern USA','Cinco Bayou'),('USA','FL','Southern USA','Clearwater'),('USA','FL','Southern USA','Clermont'),('USA','FL','Southern USA','Clewiston'),('USA','FL','Southern USA','Cloud Lake'),('USA','FL','Southern USA','Cocoa'),('USA','FL','Southern USA','Cocoa Beach'),('USA','FL','Southern USA','Coconut Creek'),('USA','FL','Southern USA','Coleman'),('USA','FL','Southern USA','Cooper City'),('USA','FL','Southern USA','Coral Gables'),('USA','FL','Southern USA','Coral Springs'),('USA','FL','Southern USA','Cottondale'),('USA','FL','Southern USA','Crescent City'),('USA','FL','Southern USA','Crestview'),('USA','FL','Southern USA','Cross City'),('USA','FL','Southern USA','Crystal River')," + 
                "('USA','FL','Southern USA','Cutler Bay'),('USA','FL','Southern USA','Dade City'),('USA','FL','Southern USA','Dania Beach'),('USA','FL','Southern USA','Davenport'),('USA','FL','Southern USA','Davie'),('USA','FL','Southern USA','Daytona Beach'),('USA','FL','Southern USA','Daytona Beach Shores'),('USA','FL','Southern USA','DeBary'),('USA','FL','Southern USA','Deerfield Beach'),('USA','FL','Southern USA','Deuniak Springs'),('USA','FL','Southern USA','Deland'),('USA','FL','Southern USA','Delray Beach'),('USA','FL','Southern USA','Deltona'),('USA','FL','Southern USA','Destin'),('USA','FL','Southern USA','Doral'),('USA','FL','Southern USA','Dundee'),('USA','FL','Southern USA','Dunedin'),('USA','FL','Southern USA','Dunnellon'),('USA','FL','Southern USA','Eagle Lake'),('USA','FL','Southern USA','Eatonville'),('USA','FL','Southern USA','Ebro'),('USA','FL','Southern USA','Edgewater'),('USA','FL','Southern USA','Edgewood'),('USA','FL','Southern USA','El Portal'),('USA','FL','Southern USA','Esto'),('USA','FL','Southern USA','Eustis'),('USA','FL','Southern USA','Everglades City'),('USA','FL','Southern USA','Fanning Springs'),('USA','FL','Southern USA','Fellsmere'),('USA','FL','Southern USA','Fernandina Beach'),('USA','FL','Southern USA','Flagler Beach'),('USA','FL','Southern USA','Florida City'),('USA','FL','Southern USA','Fort Lauderdale'),('USA','FL','Southern USA','Fort Meade'),('USA','FL','Southern USA','Fort Myers Beach'),('USA','FL','Southern USA','Fort Myers'),('USA','FL','Southern USA','Fort Pierce'),('USA','FL','Southern USA','Fort Walton Beach'),('USA','FL','Southern USA','Fort White')," + 
                "('USA','FL','Southern USA','Freeport'),('USA','FL','Southern USA','Frostproof'),('USA','FL','Southern USA','Fruitland Park'),('USA','FL','Southern USA','Gainesville'),('USA','FL','Southern USA','Glen Ridge'),('USA','FL','Southern USA','Glen St. Mary'),('USA','FL','Southern USA','Golden Beach'),('USA','FL','Southern USA','Golf'),('USA','FL','Southern USA','Graceville'),('USA','FL','Southern USA','Grand Ridge'),('USA','FL','Southern USA','Grant-Valkaria'),('USA','FL','Southern USA','Green Cove Springs'),('USA','FL','Southern USA','Greenacres'),('USA','FL','Southern USA','Greensboro'),('USA','FL','Southern USA','Greenville'),('USA','FL','Southern USA','Greenwood'),('USA','FL','Southern USA','Gretna'),('USA','FL','Southern USA','Groveland'),('USA','FL','Southern USA','Gulf Breeze'),('USA','FL','Southern USA','Gulf Stream'),('USA','FL','Southern USA','Gulfport'),('USA','FL','Southern USA','Haines City'),('USA','FL','Southern USA','Hallandale Beach'),('USA','FL','Southern USA','Hampton'),('USA','FL','Southern USA','Hastings'),('USA','FL','Southern USA','Havana'),('USA','FL','Southern USA','Haverhill'),('USA','FL','Southern USA','Hawthorne'),('USA','FL','Southern USA','Hialeah'),('USA','FL','Southern USA','Hialeah Gardens'),('USA','FL','Southern USA','High Springs'),('USA','FL','Southern USA','Highland Beach'),('USA','FL','Southern USA','Highland Park'),('USA','FL','Southern USA','Hillcrest Heights'),('USA','FL','Southern USA','Hilliard'),('USA','FL','Southern USA','Hillsboro Beach'),('USA','FL','Southern USA','Holly Hill'),('USA','FL','Southern USA','Hollywood'),('USA','FL','Southern USA','Holmes Beach')," + 
                "('USA','FL','Southern USA','Homestead'),('USA','FL','Southern USA','Horseshoe Beach'),('USA','FL','Southern USA','Howey-in-the-Hills'),('USA','FL','Southern USA','Hypoluxo'),('USA','FL','Southern USA','Indialantic'),('USA','FL','Southern USA','Indian Creek'),('USA','FL','Southern USA','Indian Harbour Beach'),('USA','FL','Southern USA','Indian River Shores'),('USA','FL','Southern USA','Indian Rocks Beach'),('USA','FL','Southern USA','Indian Shores'),('USA','FL','Southern USA','Inglis'),('USA','FL','Southern USA','Interlachen'),('USA','FL','Southern USA','Inverness'),('USA','FL','Southern USA','Islamorada'),('USA','FL','Southern USA','Jacksonville'),('USA','FL','Southern USA','Jacksonville Beach'),('USA','FL','Southern USA','Jacob City'),('USA','FL','Southern USA','Jasper'),('USA','FL','Southern USA','Jay'),('USA','FL','Southern USA','Jennings'),('USA','FL','Southern USA','Juno Beach'),('USA','FL','Southern USA','Jupiter'),('USA','FL','Southern USA','Jupiter Inlet Colony'),('USA','FL','Southern USA','Jupiter Island'),('USA','FL','Southern USA','Kenneth City'),('USA','FL','Southern USA','Key Biscayne'),('USA','FL','Southern USA','Key Colony Beach'),('USA','FL','Southern USA','Key West'),('USA','FL','Southern USA','Keystone Heights'),('USA','FL','Southern USA','Kissimmee'),('USA','FL','Southern USA','LaBelle'),('USA','FL','Southern USA','Lady Lake'),('USA','FL','Southern USA','Lake Alfred'),('USA','FL','Southern USA','Lake Butler'),('USA','FL','Southern USA','Lake City'),('USA','FL','Southern USA','Lake Clarke Shores'),('USA','FL','Southern USA','Lake Hamilton'),('USA','FL','Southern USA','Lake Helen')," + 
                "('USA','FL','Southern USA','Lake Mary'),('USA','FL','Southern USA','Lake Park'),('USA','FL','Southern USA','Lake Placid'),('USA','FL','Southern USA','Lake Wales'),('USA','FL','Southern USA','Lake Worth'),('USA','FL','Southern USA','Lakeland'),('USA','FL','Southern USA','Lantana'),('USA','FL','Southern USA','Largo'),('USA','FL','Southern USA','Lauderdale Lake'),('USA','FL','Southern USA','Lauderdale-by-the-Sea'),('USA','FL','Southern USA','Lauderhill'),('USA','FL','Southern USA','Laurel Hill'),('USA','FL','Southern USA','Lawtey Nour Town'),('USA','FL','Southern USA','Layton'),('USA','FL','Southern USA','Lee'),('USA','FL','Southern USA','Leesburg'),('USA','FL','Southern USA','Lighthouse Point'),('USA','FL','Southern USA','Live Oak'),('USA','FL','Southern USA','Longboat Key'),('USA','FL','Southern USA','Longwood'),('USA','FL','Southern USA','Loxahatchee Groves'),('USA','FL','Southern USA','Lynn Haven'),('USA','FL','Southern USA','Macclenny'),('USA','FL','Southern USA','Madeira Beach'),('USA','FL','Southern USA','Madison'),('USA','FL','Southern USA','Maitland'),('USA','FL','Southern USA','Malabar'),('USA','FL','Southern USA','Malone'),('USA','FL','Southern USA','Manalapan'),('USA','FL','Southern USA','Mangonia Park'),('USA','FL','Southern USA','Marathon'),('USA','FL','Southern USA','Marco Island'),('USA','FL','Southern USA','Margate'),('USA','FL','Southern USA','Marianna'),('USA','FL','Southern USA','Mary Esther'),('USA','FL','Southern USA','Mascotte'),('USA','FL','Southern USA','Mayo'),('USA','FL','Southern USA','McIntosh'),('USA','FL','Southern USA','Medley'),('USA','FL','Southern USA','Melbourne')," + 
                "('USA','FL','Southern USA','Melbourne Beach'),('USA','FL','Southern USA','Melbourne Village'),('USA','FL','Southern USA','Mexico Beach'),('USA','FL','Southern USA','Miami'),('USA','FL','Southern USA','Miami Beach'),('USA','FL','Southern USA','Miami Gardens'),('USA','FL','Southern USA','Miami Lakes'),('USA','FL','Southern USA','Miami Shores'),('USA','FL','Southern USA','Miami Springs'),('USA','FL','Southern USA','Micanopy'),('USA','FL','Southern USA','Midway'),('USA','FL','Southern USA','Milton'),('USA','FL','Southern USA','Minneola'),('USA','FL','Southern USA','Miramar'),('USA','FL','Southern USA','Monticello'),('USA','FL','Southern USA','Montverde'),('USA','FL','Southern USA','Moore Haven'),('USA','FL','Southern USA','Mount Dora'),('USA','FL','Southern USA','Mulberry'),('USA','FL','Southern USA','Naples'),('USA','FL','Southern USA','Neptune Beach'),('USA','FL','Southern USA','New Port Richey'),('USA','FL','Southern USA','New Smyrna Beach'),('USA','FL','Southern USA','Newberry'),('USA','FL','Southern USA','Niceville'),('USA','FL','Southern USA','Noma'),('USA','FL','Southern USA','North Bay Village'),('USA','FL','Southern USA','North Lauderdale'),('USA','FL','Southern USA','North Miami'),('USA','FL','Southern USA','North Miami Beach'),('USA','FL','Southern USA','North Palm Beach'),('USA','FL','Southern USA','North Port'),('USA','FL','Southern USA','North Redington Beach'),('USA','FL','Southern USA','Oak Hill'),('USA','FL','Southern USA','Oakland'),('USA','FL','Southern USA','Oakland Park'),('USA','FL','Southern USA','Ocala'),('USA','FL','Southern USA','Ocean Breeze'),('USA','FL','Southern USA','Ocean Ridge')," + 
                "('USA','FL','Southern USA','Ocoee'),('USA','FL','Southern USA','Okeechobee'),('USA','FL','Southern USA','Oldsmar'),('USA','FL','Southern USA','Opa-locka'),('USA','FL','Southern USA','Orange City'),('USA','FL','Southern USA','Orange Park'),('USA','FL','Southern USA','Orchid'),('USA','FL','Southern USA','Orlando'),('USA','FL','Southern USA','Ormond Beach'),('USA','FL','Southern USA','Otter Creek'),('USA','FL','Southern USA','Oviedo'),('USA','FL','Southern USA','Pahokee'),('USA','FL','Southern USA','Palatka'),('USA','FL','Southern USA','Palm Bay'),('USA','FL','Southern USA','Palm Beach'),('USA','FL','Southern USA','Palm Beach Gardens'),('USA','FL','Southern USA','Palm Beach Shores'),('USA','FL','Southern USA','Palm Coast'),('USA','FL','Southern USA','Palm Shores'),('USA','FL','Southern USA','Palm Springs'),('USA','FL','Southern USA','Palmetto'),('USA','FL','Southern USA','Palmetto Bay'),('USA','FL','Southern USA','Panama City'),('USA','FL','Southern USA','Panama City Beach'),('USA','FL','Southern USA','Parker'),('USA','FL','Southern USA','Parkland'),('USA','FL','Southern USA','Paxton'),('USA','FL','Southern USA','Pembroke Park'),('USA','FL','Southern USA','Pembroke Pines'),('USA','FL','Southern USA','Penney Farms'),('USA','FL','Southern USA','Pensacola'),('USA','FL','Southern USA','Perry'),('USA','FL','Southern USA','Pierson'),('USA','FL','Southern USA','Pinecrest'),('USA','FL','Southern USA','Pinellas Park'),('USA','FL','Southern USA','Plant City'),('USA','FL','Southern USA','Plantation'),('USA','FL','Southern USA','Polk City'),('USA','FL','Southern USA','Pomona Park'),('USA','FL','Southern USA','Pompano Beach')," + 
                "('USA','FL','Southern USA','Ponce de Leon'),('USA','FL','Southern USA','Ponce Inlet'),('USA','FL','Southern USA','Port Orange'),('USA','FL','Southern USA','Port Richey'),('USA','FL','Southern USA','Port St. Joe'),('USA','FL','Southern USA','Port St. Lucie'),('USA','FL','Southern USA','Punta Gorda'),('USA','FL','Southern USA','Quincy'),('USA','FL','Southern USA','Raiford'),('USA','FL','Southern USA','Reddick'),('USA','FL','Southern USA','Redington Beach'),('USA','FL','Southern USA','Redington Shores'),('USA','FL','Southern USA','Riviera Beach'),('USA','FL','Southern USA','Rockledge'),('USA','FL','Southern USA','Royal Palm Beach'),('USA','FL','Southern USA','Safety Harbour'),('USA','FL','Southern USA','San Antonio'),('USA','FL','Southern USA','Sanford'),('USA','FL','Southern USA','Sanibel'),('USA','FL','Southern USA','Sarasota'),('USA','FL','Southern USA','Satellite Beach'),('USA','FL','Southern USA','Sea Ranch Lakes'),('USA','FL','Southern USA','Sebastian'),('USA','FL','Southern USA','Sebring'),('USA','FL','Southern USA','Seminole'),('USA','FL','Southern USA','Sewall\'s Point'),('USA','FL','Southern USA','Shalimar'),('USA','FL','Southern USA','Sneads'),('USA','FL','Southern USA','Sopchoppy'),('USA','FL','Southern USA','South Bay'),('USA','FL','Southern USA','South Daytona'),('USA','FL','Southern USA','South Miami'),('USA','FL','Southern USA','South Palm Beach'),('USA','FL','Southern USA','South Pasadena'),('USA','FL','Southern USA','Southwest Ranches'),('USA','FL','Southern USA','Springfield'),('USA','FL','Southern USA','Starke'),('USA','FL','Southern USA','Stuart'),('USA','FL','Southern USA','St. Augustine')," + 
                "('USA','FL','Southern USA','St. Augustine Beach'),('USA','FL','Southern USA','St. Cloud'),('USA','FL','Southern USA','St. Leo'),('USA','FL','Southern USA','St. Lucie Village'),('USA','FL','Southern USA','St. Marks'),('USA','FL','Southern USA','St. Pete Beach'),('USA','FL','Southern USA','St. Petersburg'),('USA','FL','Southern USA','Sunny Isles Beach'),('USA','FL','Southern USA','Sunrise'),('USA','FL','Southern USA','Surfside'),('USA','FL','Southern USA','Sweetwater'),('USA','FL','Southern USA','Tallahassee'),('USA','FL','Southern USA','Tamarac'),('USA','FL','Southern USA','Tampa'),('USA','FL','Southern USA','Tarpon Springs'),('USA','FL','Southern USA','Tavares'),('USA','FL','Southern USA','Temple Terrace'),('USA','FL','Southern USA','Tequesta'),('USA','FL','Southern USA','Titusville'),('USA','FL','Southern USA','Treasure Island'),('USA','FL','Southern USA','Trenton'),('USA','FL','Southern USA','Umatilla'),('USA','FL','Southern USA','Valparaiso'),('USA','FL','Southern USA','Venice'),('USA','FL','Southern USA','Vernon'),('USA','FL','Southern USA','Vero Beach'),('USA','FL','Southern USA','Virginia Gardens'),('USA','FL','Southern USA','Waldo'),('USA','FL','Southern USA','Wauchula'),('USA','FL','Southern USA','Wausau'),('USA','FL','Southern USA','Webster'),('USA','FL','Southern USA','Welaka'),('USA','FL','Southern USA','Wellington'),('USA','FL','Southern USA','West Melbourne'),('USA','FL','Southern USA','West Miami'),('USA','FL','Southern USA','West Palm Beach'),('USA','FL','Southern USA','West Park'),('USA','FL','Southern USA','Weston'),('USA','FL','Southern USA','Westville')," + 
                "('USA','FL','Southern USA','Wewehitchka'),('USA','FL','Southern USA','White Springs'),('USA','FL','Southern USA','Wildwood'),('USA','FL','Southern USA','Williston'),('USA','FL','Southern USA','Wilton Manors'),('USA','FL','Southern USA','Mindermere'),('USA','FL','Southern USA','Winter Garden'),('USA','FL','Southern USA','Winter Haven'),('USA','FL','Southern USA','Winter Park'),('USA','FL','Southern USA','Winter Springs'),('USA','FL','Southern USA','Worthington Springs'),('USA','FL','Southern USA','Yankeetown'),('USA','FL','Southern USA','Zephyrhills'),('USA','FL','Southern USA','Zolfo Springs')");
            //Georgia
            db.ExecuteSql("Insert into northAmerica Values('USA','GA','Southern USA','Abbeville'),('USA','GA','Southern USA','Acworth'),('USA','GA','Southern USA','Adairsville'),('USA','GA','Southern USA','Adel'),('USA','GA','Southern USA','Adrian'),('USA','GA','Southern USA','Ailey'),('USA','GA','Southern USA','Alamo'),('USA','GA','Southern USA','Alapaha'),('USA','GA','Southern USA','Albany'),('USA','GA','Southern USA','Aldora'),('USA','GA','Southern USA','Allenhurst'),('USA','GA','Southern USA','Allentown'),('USA','GA','Southern USA','Alma'),('USA','GA','Southern USA','Alpharetta'),('USA','GA','Southern USA','Alston'),('USA','GA','Southern USA','Alto'),('USA','GA','Southern USA','Ambrose'),('USA','GA','Southern USA','Americus'),('USA','GA','Southern USA','Andersonville'),('USA','GA','Southern USA','Arabi'),('USA','GA','Southern USA','Aragon'),('USA','GA','Southern USA','Arcade'),('USA','GA','Southern USA','Argyle'),('USA','GA','Southern USA','Arlington'),('USA','GA','Southern USA','Arnoldsville'),('USA','GA','Southern USA','Ashburn'),('USA','GA','Southern USA','Athens'),('USA','GA','Southern USA','Atlanta'),('USA','GA','Southern USA','Attapulgus'),('USA','GA','Southern USA','Aubrun'),('USA','GA','Southern USA','Augusta'),('USA','GA','Southern USA','Austell'),('USA','GA','Southern USA','Avalon'),('USA','GA','Southern USA','Avera'),('USA','GA','Southern USA','Avondale Estates'),('USA','GA','Southern USA','Baconton'),('USA','GA','Southern USA','Bainbridge'),('USA','GA','Southern USA','Baldwin'),('USA','GA','Southern USA','Ball Ground'),('USA','GA','Southern USA','Barnesville'),('USA','GA','Southern USA','Bartow')," + 
                "('USA','GA','Southern USA','Barwick'),('USA','GA','Southern USA','Baxley'),('USA','GA','Southern USA','Bellville'),('USA','GA','Southern USA','Berkeley Lake'),('USA','GA','Southern USA','Berlin'),('USA','GA','Southern USA','Bethlehem'),('USA','GA','Southern USA','Between'),('USA','GA','Southern USA','Bishop'),('USA','GA','Southern USA','Blackshear'),('USA','GA','Southern USA','Blairsville'),('USA','GA','Southern USA','Blakely'),('USA','GA','Southern USA','Bloomingdale'),('USA','GA','Southern USA','Blue Ridge'),('USA','GA','Southern USA','Bluffton'),('USA','GA','Southern USA','Blythe'),('USA','GA','Southern USA','Bogart'),('USA','GA','Southern USA','Boston'),('USA','GA','Southern USA','Bostwick'),('USA','GA','Southern USA','Bowdon'),('USA','GA','Southern USA','Bowersville'),('USA','GA','Southern USA','Bowman'),('USA','GA','Southern USA','Braselton'),('USA','GA','Southern USA','Braswell'),('USA','GA','Southern USA','Bremen'),('USA','GA','Southern USA','Brinson'),('USA','GA','Southern USA','Bronwood'),('USA','GA','Southern USA','Brookhaven'),('USA','GA','Southern USA','Brooklet'),('USA','GA','Southern USA','Brooks'),('USA','GA','Southern USA','Broxton'),('USA','GA','Southern USA','Brunswick'),('USA','GA','Southern USA','Buchanan'),('USA','GA','Southern USA','Buckhead'),('USA','GA','Southern USA','Buena Vista'),('USA','GA','Southern USA','Buford'),('USA','GA','Southern USA','Butler'),('USA','GA','Southern USA','Byromville'),('USA','GA','Southern USA','Byron'),('USA','GA','Southern USA','Cadwell'),('USA','GA','Southern USA','Cairo'),('USA','GA','Southern USA','Calhoun'),('USA','GA','Southern USA','Camak')," + 
                "('USA','GA','Southern USA','Camilla'),('USA','GA','Southern USA','Canon'),('USA','GA','Southern USA','Canton'),('USA','GA','Southern USA','Carl'),('USA','GA','Southern USA','Carlton'),('USA','GA','Southern USA','Carnesville'),('USA','GA','Southern USA','Carrollton'),('USA','GA','Southern USA','Cartersville'),('USA','GA','Southern USA','Cave Spring'),('USA','GA','Southern USA','Cecil'),('USA','GA','Southern USA','Cedartown'),('USA','GA','Southern USA','Centerville'),('USA','GA','Southern USA','Centralhatchee'),('USA','GA','Southern USA','Chamblee'),('USA','GA','Southern USA','Chatsworth'),('USA','GA','Southern USA','Chattahoochee Hills'),('USA','GA','Southern USA','Chauncey'),('USA','GA','Southern USA','Chester'),('USA','GA','Southern USA','Chickamauga'),('USA','GA','Southern USA','Clarkesville'),('USA','GA','Southern USA','Clarkston'),('USA','GA','Southern USA','Claxton'),('USA','GA','Southern USA','Clayton'),('USA','GA','Southern USA','Clermont'),('USA','GA','Southern USA','Cleveland'),('USA','GA','Southern USA','Climax'),('USA','GA','Southern USA','Cobbtown'),('USA','GA','Southern USA','Cochran'),('USA','GA','Southern USA','Cohutta'),('USA','GA','Southern USA','Colbert'),('USA','GA','Southern USA','College Park'),('USA','GA','Southern USA','Collins'),('USA','GA','Southern USA','Colquitt'),('USA','GA','Southern USA','Columbus'),('USA','GA','Southern USA','Comer'),('USA','GA','Southern USA','Commerce'),('USA','GA','Southern USA','Concord'),('USA','GA','Southern USA','Conyers'),('USA','GA','Southern USA','Coolidge'),('USA','GA','Southern USA','Cordele'),('USA','GA','Southern USA','Cornelia')," + 
                "('USA','GA','Southern USA','Covington'),('USA','GA','Southern USA','Crawford'),('USA','GA','Southern USA','Crawfordville'),('USA','GA','Southern USA','Culloden'),('USA','GA','Southern USA','Cumming'),('USA','GA','Southern USA','Cusseta'),('USA','GA','Southern USA','Cuthbert'),('USA','GA','Southern USA','Dacula'),('USA','GA','Southern USA','Dahlonega'),('USA','GA','Southern USA','Daisy'),('USA','GA','Southern USA','Dallas'),('USA','GA','Southern USA','Dalton'),('USA','GA','Southern USA','Damascus'),('USA','GA','Southern USA','Danielsville'),('USA','GA','Southern USA','Danville'),('USA','GA','Southern USA','Darien'),('USA','GA','Southern USA','Dasher'),('USA','GA','Southern USA','Davisboro'),('USA','GA','Southern USA','Dawson'),('USA','GA','Southern USA','Dawsonville'),('USA','GA','Southern USA','De Soto'),('USA','GA','Southern USA','Dearing'),('USA','GA','Southern USA','Decatur'),('USA','GA','Southern USA','Deepstep'),('USA','GA','Southern USA','Demorest'),('USA','GA','Southern USA','Denton'),('USA','GA','Southern USA','Dexter'),('USA','GA','Southern USA','Dillard'),('USA','GA','Southern USA','Doerun'),('USA','GA','Southern USA','Donalsonville'),('USA','GA','Southern USA','Dooling'),('USA','GA','Southern USA','Doraville'),('USA','GA','Southern USA','Douglas'),('USA','GA','Southern USA','Douglasville'),('USA','GA','Southern USA','Dublin'),('USA','GA','Southern USA','Dudley'),('USA','GA','Southern USA','Duluth'),('USA','GA','Southern USA','Dunwoody'),('USA','GA','Southern USA','East Dublin'),('USA','GA','Southern USA','East Ellijay'),('USA','GA','Southern USA','East Point'),('USA','GA','Southern USA','Eastman')," + 
                "('USA','GA','Southern USA','Eatonton'),('USA','GA','Southern USA','Echols County'),('USA','GA','Southern USA','Edison'),('USA','GA','Southern USA','Elberton'),('USA','GA','Southern USA','Ellaville'),('USA','GA','Southern USA','Ellenton'),('USA','GA','Southern USA','Ellijay'),('USA','GA','Southern USA','Emerson'),('USA','GA','Southern USA','Enigma'),('USA','GA','Southern USA','Ephesus'),('USA','GA','Southern USA','Eton'),('USA','GA','Southern USA','Euharlee'),('USA','GA','Southern USA','Fairburn'),('USA','GA','Southern USA','Fairmount'),('USA','GA','Southern USA','Fargo'),('USA','GA','Southern USA','Fayetteville'),('USA','GA','Southern USA','Fitzgerald'),('USA','GA','Southern USA','Flemington'),('USA','GA','Southern USA','Flovilla'),('USA','GA','Southern USA','Flowery Branch'),('USA','GA','Southern USA','Folkston'),('USA','GA','Southern USA','Forest Park'),('USA','GA','Southern USA','Forsyth'),('USA','GA','Southern USA','Fort Gaines'),('USA','GA','Southern USA','Fort Oglethorpe'),('USA','GA','Southern USA','Fort Valley'),('USA','GA','Southern USA','Franklin'),('USA','GA','Southern USA','Franklin Springs'),('USA','GA','Southern USA','Funston'),('USA','GA','Southern USA','Garden City'),('USA','GA','Southern USA','Garfield'),('USA','GA','Southern USA','Georgetown'),('USA','GA','Southern USA','Gibson'),('USA','GA','Southern USA','Gillsville'),('USA','GA','Southern USA','Glennville'),('USA','GA','Southern USA','Glenwood'),('USA','GA','Southern USA','Good Hope'),('USA','GA','Southern USA','Gordon'),('USA','GA','Southern USA','Graham'),('USA','GA','Southern USA','Grantville'),('USA','GA','Southern USA','Gray')," + 
                "('USA','GA','Southern USA','Grayson'),('USA','GA','Southern USA','Greensboro'),('USA','GA','Southern USA','Greenville'),('USA','GA','Southern USA','Griffin'),('USA','GA','Southern USA','Grovetown'),('USA','GA','Southern USA','Gumbranch'),('USA','GA','Southern USA','Guyton'),('USA','GA','Southern USA','Hagan'),('USA','GA','Southern USA','Hahira'),('USA','GA','Southern USA','Hamilton'),('USA','GA','Southern USA','Hampton'),('USA','GA','Southern USA','Hapeville'),('USA','GA','Southern USA','Haralson'),('USA','GA','Southern USA','Harlem'),('USA','GA','Southern USA','Harrison'),('USA','GA','Southern USA','Hartwell'),('USA','GA','Southern USA','Hawkinsville'),('USA','GA','Southern USA','Hazlehurst'),('USA','GA','Southern USA','Helen'),('USA','GA','Southern USA','Helena'),('USA','GA','Southern USA','Hephzibah'),('USA','GA','Southern USA','Hiawassee'),('USA','GA','Southern USA','Higgston'),('USA','GA','Southern USA','Hiltonia'),('USA','GA','Southern USA','Hinesville'),('USA','GA','Southern USA','Hiram'),('USA','GA','Southern USA','Hoboken'),('USA','GA','Southern USA','Hogansville'),('USA','GA','Southern USA','Holly Springs'),('USA','GA','Southern USA','Homeland'),('USA','GA','Southern USA','Homer'),('USA','GA','Southern USA','Homerville'),('USA','GA','Southern USA','Hoschton'),('USA','GA','Southern USA','Hull'),('USA','GA','Southern USA','Ideal'),('USA','GA','Southern USA','Ila'),('USA','GA','Southern USA','Iron City'),('USA','GA','Southern USA','Irwinton'),('USA','GA','Southern USA','Ivey'),('USA','GA','Southern USA','Jackson'),('USA','GA','Southern USA','Jacksonville'),('USA','GA','Southern USA','Jakin')," + 
                "('USA','GA','Southern USA','Jasper'),('USA','GA','Southern USA','Jefferson'),('USA','GA','Southern USA','Jeffersonville'),('USA','GA','Southern USA','Jenkinsburg'),('USA','GA','Southern USA','Jesup'),('USA','GA','Southern USA','Johns Creek'),('USA','GA','Southern USA','Jonesboro'),('USA','GA','Southern USA','Junction City'),('USA','GA','Southern USA','Kennesaw'),('USA','GA','Southern USA','Keysville'),('USA','GA','Southern USA','Kingsland'),('USA','GA','Southern USA','Kingston'),('USA','GA','Southern USA','Kite'),('USA','GA','Southern USA','LaFayette'),('USA','GA','Southern USA','LaGrange'),('USA','GA','Southern USA','Lake City'),('USA','GA','Southern USA','Lake Park'),('USA','GA','Southern USA','Lakeland'),('USA','GA','Southern USA','Lavonia'),('USA','GA','Southern USA','Lawrenceville'),('USA','GA','Southern USA','Leary'),('USA','GA','Southern USA','Leesburg'),('USA','GA','Southern USA','Lenox'),('USA','GA','Southern USA','Leslie'),('USA','GA','Southern USA','Lexington'),('USA','GA','Southern USA','Lilburn'),('USA','GA','Southern USA','Lilly'),('USA','GA','Southern USA','Lincolnton'),('USA','GA','Southern USA','Lithonia'),('USA','GA','Southern USA','Locust Grove'),('USA','GA','Southern USA','Loganville'),('USA','GA','Southern USA','Lookout Mountain'),('USA','GA','Southern USA','Louisville'),('USA','GA','Southern USA','Lovejoy'),('USA','GA','Southern USA','Ludowici'),('USA','GA','Southern USA','Lula'),('USA','GA','Southern USA','Lumber City'),('USA','GA','Southern USA','Lumpkin'),('USA','GA','Southern USA','Luthersville'),('USA','GA','Southern USA','Lyerly'),('USA','GA','Southern USA','Lyons')," + 
                "('USA','GA','Southern USA','Macon'),('USA','GA','Southern USA','Madison'),('USA','GA','Southern USA','Manchester'),('USA','GA','Southern USA','Mansfield'),('USA','GA','Southern USA','Marietta'),('USA','GA','Southern USA','Marshallville'),('USA','GA','Southern USA','Martin'),('USA','GA','Southern USA','Maxeys'),('USA','GA','Southern USA','Maysville'),('USA','GA','Southern USA','McCaysville'),('USA','GA','Southern USA','McDonough'),('USA','GA','Southern USA','McIntyre'),('USA','GA','Southern USA','McRae'),('USA','GA','Southern USA','Meansville'),('USA','GA','Southern USA','Meigs'),('USA','GA','Southern USA','Menlo'),('USA','GA','Southern USA','Metter'),('USA','GA','Southern USA','Midville'),('USA','GA','Southern USA','Midway'),('USA','GA','Southern USA','Milan'),('USA','GA','Southern USA','Milledgeville'),('USA','GA','Southern USA','Milen'),('USA','GA','Southern USA','Milner'),('USA','GA','Southern USA','Milton'),('USA','GA','Southern USA','Mitchell'),('USA','GA','Southern USA','Molena'),('USA','GA','Southern USA','Monroe'),('USA','GA','Southern USA','Montezuma'),('USA','GA','Southern USA','Monticello'),('USA','GA','Southern USA','Montrose'),('USA','GA','Southern USA','Moreland'),('USA','GA','Southern USA','Morgan'),('USA','GA','Southern USA','Morganton'),('USA','GA','Southern USA','Morrow'),('USA','GA','Southern USA','Morven'),('USA','GA','Southern USA','Moultrie'),('USA','GA','Southern USA','Mount Airy'),('USA','GA','Southern USA','Mount Vernon'),('USA','GA','Southern USA','Mount Zion'),('USA','GA','Southern USA','Mountain City'),('USA','GA','Southern USA','Mountain Park'),('USA','GA','Southern USA','Nahunta')," + 
                "('USA','GA','Southern USA','Nashville'),('USA','GA','Southern USA','Nelson'),('USA','GA','Southern USA','Newborn'),('USA','GA','Southern USA','Newington'),('USA','GA','Southern USA','Newnan'),('USA','GA','Southern USA','Newton'),('USA','GA','Southern USA','Nicholls'),('USA','GA','Southern USA','Nicholson'),('USA','GA','Southern USA','Norcross'),('USA','GA','Southern USA','Norman Park'),('USA','GA','Southern USA','North High Shoals'),('USA','GA','Southern USA','Norwood'),('USA','GA','Southern USA','Nunez'),('USA','GA','Southern USA','Oak Park'),('USA','GA','Southern USA','Oakwood'),('USA','GA','Southern USA','Ochlocknee'),('USA','GA','Southern USA','Ocilla'),('USA','GA','Southern USA','Oconee'),('USA','GA','Southern USA','Odum'),('USA','GA','Southern USA','Offerman'),('USA','GA','Southern USA','Oglethorpe'),('USA','GA','Southern USA','Oliver'),('USA','GA','Southern USA','Omega'),('USA','GA','Southern USA','Orchard Hill'),('USA','GA','Southern USA','Oxford'),('USA','GA','Southern USA','Palmetto'),('USA','GA','Southern USA','Parrot'),('USA','GA','Southern USA','Patterson'),('USA','GA','Southern USA','Pavo'),('USA','GA','Southern USA','Peachtree City'),('USA','GA','Southern USA','Peachtree Corners'),('USA','GA','Southern USA','Pearson'),('USA','GA','Southern USA','Pelham'),('USA','GA','Southern USA','Pembroke'),('USA','GA','Southern USA','Pendergrass'),('USA','GA','Southern USA','Perry'),('USA','GA','Southern USA','Pine Lake'),('USA','GA','Southern USA','Pine Mountain'),('USA','GA','Southern USA','Pinehurst'),('USA','GA','Southern USA','Pineview'),('USA','GA','Southern USA','Pitts')," + 
                "('USA','GA','Southern USA','Plains'),('USA','GA','Southern USA','Plainville'),('USA','GA','Southern USA','Pooler'),('USA','GA','Southern USA','Port Wentworth'),('USA','GA','Southern USA','Portal'),('USA','GA','Southern USA','Porterdal'),('USA','GA','Southern USA','Poulan'),('USA','GA','Southern USA','Powder Springs'),('USA','GA','Southern USA','Pulaski'),('USA','GA','Southern USA','Quitman'),('USA','GA','Southern USA','Ranger'),('USA','GA','Southern USA','Ray City'),('USA','GA','Southern USA','Rayle'),('USA','GA','Southern USA','Rebecca'),('USA','GA','Southern USA','Register'),('USA','GA','Southern USA','Reidsville'),('USA','GA','Southern USA','Remerton'),('USA','GA','Southern USA','Rentz'),('USA','GA','Southern USA','Resaca'),('USA','GA','Southern USA','Reynolds'),('USA','GA','Southern USA','Rhine'),('USA','GA','Southern USA','Riceboro'),('USA','GA','Southern USA','Richland'),('USA','GA','Southern USA','Richmond Hill'),('USA','GA','Southern USA','Rincon'),('USA','GA','Southern USA','Ringgold'),('USA','GA','Southern USA','Riverdale'),('USA','GA','Southern USA','Roberta'),('USA','GA','Southern USA','Rochelle'),('USA','GA','Southern USA','Rockmart'),('USA','GA','Southern USA','Rocky Ford'),('USA','GA','Southern USA','Rome'),('USA','GA','Southern USA','Roopville'),('USA','GA','Southern USA','Rossville'),('USA','GA','Southern USA','Roswell'),('USA','GA','Southern USA','Royston'),('USA','GA','Southern USA','Rutledge'),('USA','GA','Southern USA','Sale City'),('USA','GA','Southern USA','Sandersville'),('USA','GA','Southern USA','Sandy Springs'),('USA','GA','Southern USA','Santa Claus')," + 
                "('USA','GA','Southern USA','Sardis'),('USA','GA','Southern USA','Sasser'),('USA','GA','Southern USA','Savannah'),('USA','GA','Southern USA','Scotland'),('USA','GA','Southern USA','Screven'),('USA','GA','Southern USA','Senoia'),('USA','GA','Southern USA','Shady Dale'),('USA','GA','Southern USA','Sharon'),('USA','GA','Southern USA','Sharpsburg'),('USA','GA','Southern USA','Shellman'),('USA','GA','Southern USA','Shiloh'),('USA','GA','Southern USA','Siloam'),('USA','GA','Southern USA','Sky Valley'),('USA','GA','Southern USA','Smithville'),('USA','GA','Southern USA','Smyrna'),('USA','GA','Southern USA','Snellville'),('USA','GA','Southern USA','Social Circle'),('USA','GA','Southern USA','Soperton'),('USA','GA','Southern USA','Sparks'),('USA','GA','Southern USA','Sparta'),('USA','GA','Southern USA','Springfield'),('USA','GA','Southern USA','Stapleton'),('USA','GA','Southern USA','Statesboro'),('USA','GA','Southern USA','Statham'),('USA','GA','Southern USA','Stillmore'),('USA','GA','Southern USA','Stockbridge'),('USA','GA','Southern USA','Stone Mountain'),('USA','GA','Southern USA','St. Marys'),('USA','GA','Southern USA','Sugar Hill'),('USA','GA','Southern USA','Summertown'),('USA','GA','Southern USA','Summerville'),('USA','GA','Southern USA','Sumner'),('USA','GA','Southern USA','Sunny Side'),('USA','GA','Southern USA','Surrency'),('USA','GA','Southern USA','Suwanee'),('USA','GA','Southern USA','Swainsboro'),('USA','GA','Southern USA','Sycamore'),('USA','GA','Southern USA','Sylvania'),('USA','GA','Southern USA','Sylvester'),('USA','GA','Southern USA','Talbotton'),('USA','GA','Southern USA','Tallapoosa')," + 
                "('USA','GA','Southern USA','Tallulah Falls'),('USA','GA','Southern USA','Talmo'),('USA','GA','Southern USA','Taylorsville'),('USA','GA','Southern USA','Temple'),('USA','GA','Southern USA','Tennille'),('USA','GA','Southern USA','Thomaston'),('USA','GA','Southern USA','Thomasville'),('USA','GA','Southern USA','Thomson'),('USA','GA','Southern USA','Thunderboldt'),('USA','GA','Southern USA','Tifton'),('USA','GA','Southern USA','Tiger'),('USA','GA','Southern USA','Tignall'),('USA','GA','Southern USA','Toccoa'),('USA','GA','Southern USA','Toomsboro'),('USA','GA','Southern USA','Trenton'),('USA','GA','Southern USA','Trion'),('USA','GA','Southern USA','Tunnel Hill'),('USA','GA','Southern USA','Turin'),('USA','GA','Southern USA','Twin City'),('USA','GA','Southern USA','Ty Ty'),('USA','GA','Southern USA','Tybee Island'),('USA','GA','Southern USA','Tyrone'),('USA','GA','Southern USA','Unadilla'),('USA','GA','Southern USA','Union City'),('USA','GA','Southern USA','Union Point'),('USA','GA','Southern USA','Uvalda'),('USA','GA','Southern USA','Valdosta'),('USA','GA','Southern USA','Varnell'),('USA','GA','Southern USA','Vernonburg'),('USA','GA','Southern USA','Vidalia'),('USA','GA','Southern USA','Vidette'),('USA','GA','Southern USA','Vienna'),('USA','GA','Southern USA','Villa Rica'),('USA','GA','Southern USA','Waco'),('USA','GA','Southern USA','Wadley'),('USA','GA','Southern USA','Waleska'),('USA','GA','Southern USA','Walnut Grove'),('USA','GA','Southern USA','Walthourville'),('USA','GA','Southern USA','Warm Springs'),('USA','GA','Southern USA','Warner Robins'),('USA','GA','Southern USA','Warrenton')," + 
                "('USA','GA','Southern USA','Warwick'),('USA','GA','Southern USA','Washington'),('USA','GA','Southern USA','Watkinsville'),('USA','GA','Southern USA','Waverly Hall'),('USA','GA','Southern USA','Waycross'),('USA','GA','Southern USA','Waynesboro'),('USA','GA','Southern USA','Webster County'),('USA','GA','Southern USA','West Point'),('USA','GA','Southern USA','Whigham'),('USA','GA','Southern USA','White'),('USA','GA','Southern USA','White Plains'),('USA','GA','Southern USA','Whitesburg'),('USA','GA','Southern USA','Willacoochee'),('USA','GA','Southern USA','Williamson'),('USA','GA','Southern USA','Winder'),('USA','GA','Southern USA','Winterville'),('USA','GA','Southern USA','Woodbine'),('USA','GA','Southern USA','Woodbury'),('USA','GA','Southern USA','Woodland'),('USA','GA','Southern USA','Woodstock'),('USA','GA','Southern USA','Woodville'),('USA','GA','Southern USA','Woolsey'),('USA','GA','Southern USA','Wrens'),('USA','GA','Southern USA','Wrightsville'),('USA','GA','Southern USA','Yatesville'),('USA','GA','Southern USA','Young Harris'),('USA','GA','Southern USA','Zebulon')");
            //Hawaii
            db.ExecuteSql("Insert into northAmerica Values'USA','HI','Western USA','Ahuimanu'),('USA','HI','Western USA','Aiea'),('USA','HI','Western USA','Ainaloa'),('USA','HI','Western USA','Anahola'),('USA','HI','Western USA','Captain Cook'),('USA','HI','Western USA','Discovery Harbour'),('USA','HI','Western USA','East Honolulu'),('USA','HI','Western USA','Eden Roc'),('USA','HI','Western USA','Eleele'),('USA','HI','Western USA','Ewa Beach'),('USA','HI','Western USA','Ewa Gentry'),('USA','HI','Western USA','Ewa Villages'),('USA','HI','Western USA','Fern Acres'),('USA','HI','Western USA','Fern Forest'),('USA','HI','Western USA','Haena'),('USA','HI','Western USA','Haiku-Pauwela'),('USA','HI','Western USA','Halaula'),('USA','HI','Western USA','Halawa'),('USA','HI','Western USA','Haleiwa'),('USA','HI','Western USA','Haliimaile'),('USA','HI','Western USA','Hana'),('USA','HI','Western USA','Hanalei'),('USA','HI','Western USA','Hanamaulu'),('USA','HI','Western USA','Hanapepe'),('USA','HI','Western USA','Hauula'),('USA','HI','Western USA','Hawaiian Acres'),('USA','HI','Western USA','Hawaiian Beaches'),('USA','HI','Western USA','Hawaiian Ocean View'),('USA','HI','Western USA','Hawaiian Paradise Park'),('USA','HI','Western USA','Hawi'),('USA','HI','Western USA','Heeia'),('USA','HI','Western USA','Hickam Housing'),('USA','HI','Western USA','Hilo'),('USA','HI','Western USA','Holualoa'),('USA','HI','Western USA','Honalo'),('USA','HI','Western USA','Honaunau-Napoopoo'),('USA','HI','Western USA','Honokaa'),('USA','HI','Western USA','Honolulu'),('USA','HI','Western USA','Honomu'),('USA','HI','Western USA','Iroquois Point')," + 
                "('USA','HI','Western USA','Kaaawa'),('USA','HI','Western USA','Kaanapali'),('USA','HI','Western USA','Kahaluu'),('USA','HI','Western USA','Kahaluu-Keauhou'),('USA','HI','Western USA','Kahuku'),('USA','HI','Western USA','Kahului'),('USA','HI','Western USA','Kailua'),('USA','HI','Western USA','Kalaeloa'),('USA','HI','Western USA','Kalaheo'),('USA','HI','Western USA','Kalaoa'),('USA','HI','Western USA','Kalihiwai'),('USA','HI','Western USA','Kaneohe'),('USA','HI','Western USA','Kaneohe Station'),('USA','HI','Western USA','Kapaa'),('USA','HI','Western USA','Kapaau'),('USA','HI','Western USA','Kapalua'),('USA','HI','Western USA','Kapolei'),('USA','HI','Western USA','Kaumakani'),('USA','HI','Western USA','Kaunakakai'),('USA','HI','Western USA','Kawela Bay'),('USA','HI','Western USA','Keaau'),('USA','HI','Western USA','Kealakekua'),('USA','HI','Western USA','Kekaha'),('USA','HI','Western USA','Keokea'),('USA','HI','Western USA','Kihei'),('USA','HI','Western USA','Kilauea'),('USA','HI','Western USA','Ko Olina'),('USA','HI','Western USA','Koloa'),('USA','HI','Western USA','Kualapuu'),('USA','HI','Western USA','Kukuihaele'),('USA','HI','Western USA','Kula'),('USA','HI','Western USA','Kurtistown'),('USA','HI','Western USA','Lahaina'),('USA','HI','Western USA','Laie'),('USA','HI','Western USA','Lanai City'),('USA','HI','Western USA','Launiupoko'),('USA','HI','Western USA','Laupahoehoe'),('USA','HI','Western USA','Lawai'),('USA','HI','Western USA','Leilani Estates'),('USA','HI','Western USA','Lihue'),('USA','HI','Western USA','Maalaea'),('USA','HI','Western USA','Mahinahina'),('USA','HI','Western USA','Maili')," + 
                "('USA','HI','Western USA','Makaha'),('USA','HI','Western USA','Makaha Valley'),('USA','HI','Western USA','Makakilo'),('USA','HI','Western USA','Makawao'),('USA','HI','Western USA','Makena'),('USA','HI','Western USA','Manele'),('USA','HI','Western USA','Maunaloa'),('USA','HI','Western USA','Maunawili'),('USA','HI','Western USA','Mililani Mauka'),('USA','HI','Western USA','Mililani Town'),('USA','HI','Western USA','Mokuleia'),('USA','HI','Western USA','Mountain View'),('USA','HI','Western USA','Naalehu'),('USA','HI','Western USA','Nanakuli'),('USA','HI','Western USA','Nanawale Estates'),('USA','HI','Western USA','Napili-Honokowai'),('USA','HI','Western USA','Ocean Pointe'),('USA','HI','Western USA','Olinda'),('USA','HI','Western USA','Olowalu'),('USA','HI','Western USA','Omao'),('USA','HI','Western USA','Orchidlands Estates'),('USA','HI','Western USA','Paauilo'),('USA','HI','Western USA','Pahala'),('USA','HI','Western USA','Pahoe'),('USA','HI','Western USA','Paia'),('USA','HI','Western USA','Pakala Village'),('USA','HI','Western USA','Papaikou'),('USA','HI','Western USA','Paukaa'),('USA','HI','Western USA','Pearl City'),('USA','HI','Western USA','Pepeekeo'),('USA','HI','Western USA','Poipu'),('USA','HI','Western USA','Princeville'),('USA','HI','Western USA','Puako'),('USA','HI','Western USA','Puhi'),('USA','HI','Western USA','Pukalani'),('USA','HI','Western USA','Punaluu'),('USA','HI','Western USA','Pupukea'),('USA','HI','Western USA','Royal Kunia'),('USA','HI','Western USA','Schofield Barracks'),('USA','HI','Western USA','Ualapu\'e'),('USA','HI','Western USA','Volcano'),('USA','HI','Western USA','Wahiawa')," + 
                "('USA','HI','Western USA','Waianae'),('USA','HI','Western USA','Waihee-Waiehu'),('USA','HI','Western USA','Waikane'),('USA','HI','Western USA','Waikapu'),('USA','HI','Western USA','Waikele'),('USA','HI','Western USA','Waikoloa Village'),('USA','HI','Western USA','Wailea'),('USA','HI','Western USA','Wailua'),('USA','HI','Western USA','Wailua Homesteads'),('USA','HI','Western USA','Wailuku'),('USA','HI','Western USA','Waimalu'),('USA','HI','Western USA','Waimanalo'),('USA','HI','Western USA','Waimanalo Beach'),('USA','HI','Western USA','Waimea'),('USA','HI','Western USA','Wainaku'),('USA','HI','Western USA','Wainiha'),('USA','HI','Western USA','Waiohinu'),('USA','HI','Western USA','Waipahu'),('USA','HI','Western USA','Waipio'),('USA','HI','Western USA','Waipio Acres'),('USA','HI','Western USA','West Loch Estate'),('USA','HI','Western USA','Wheeler AFB'),('USA','HI','Western USA','Whitmore Village')");
            //Idaho
            db.ExecuteSql("Insert into northAmerica Values('USA','ID','Western USA','Aberdeen'),('USA','ID','Western USA','Acequia'),('USA','ID','Western USA','Albion'),('USA','ID','Western USA','American Falls'),('USA','ID','Western USA','Ammon'),('USA','ID','Western USA','Arco'),('USA','ID','Western USA','Arimo'),('USA','ID','Western USA','Ashton'),('USA','ID','Western USA','Athol'),('USA','ID','Western USA','Bancroft'),('USA','ID','Western USA','Basalt'),('USA','ID','Western USA','Bellevue'),('USA','ID','Western USA','Blackfoot'),('USA','ID','Western USA','Bliss'),('USA','ID','Western USA','Bloomington'),('USA','ID','Western USA','Boise'),('USA','ID','Western USA','Bonners Ferry'),('USA','ID','Western USA','Bovill'),('USA','ID','Western USA','Buhl'),('USA','ID','Western USA','Burley'),('USA','ID','Western USA','Caldwell'),('USA','ID','Western USA','Cambridge'),('USA','ID','Western USA','Carey'),('USA','ID','Western USA','Cascade'),('USA','ID','Western USA','Castleford'),('USA','ID','Western USA','Challis'),('USA','ID','Western USA','Chubbuck'),('USA','ID','Western USA','Clark Fork'),('USA','ID','Western USA','Clifton'),('USA','ID','Western USA','Coeur d\'Alene'),('USA','ID','Western USA','Cottonwood'),('USA','ID','Western USA','Council'),('USA','ID','Western USA','Craigmont'),('USA','ID','Western USA','Crouch'),('USA','ID','Western USA','Culdesac'),('USA','ID','Western USA','Dalton Gardens'),('USA','ID','Western USA','Dayton'),('USA','ID','Western USA','Deary'),('USA','ID','Western USA','Declo'),('USA','ID','Western USA','Dietrich'),('USA','ID','Western USA','Donnelly'),('USA','ID','Western USA','Dover')," + 
                "('USA','ID','Western USA','Downey'),('USA','ID','Western USA','Driggs'),('USA','ID','Western USA','Dubois'),('USA','ID','Western USA','Eagle'),('USA','ID','Western USA','East Hope'),('USA','ID','Western USA','Eden'),('USA','ID','Western USA','Elk River'),('USA','ID','Western USA','Emmett'),('USA','ID','Western USA','Fairfield'),('USA','ID','Western USA','Ferdinand'),('USA','ID','Western USA','Fernan Lake Village'),('USA','ID','Western USA','Filer'),('USA','ID','Western USA','Flirth'),('USA','ID','Western USA','Franklin'),('USA','ID','Western USA','Fruitland'),('USA','ID','Western USA','Garden City'),('USA','ID','Western USA','Genesee'),('USA','ID','Western USA','Georgetown'),('USA','ID','Western USA','Glenns Ferry'),('USA','ID','Western USA','Gooding'),('USA','ID','Western USA','Grace'),('USA','ID','Western USA','Grand View'),('USA','ID','Western USA','Grangeville'),('USA','ID','Western USA','Greenleaf'),('USA','ID','Western USA','Hagerman'),('USA','ID','Western USA','Hailey'),('USA','ID','Western USA','Hansen'),('USA','ID','Western USA','Harrison'),('USA','ID','Western USA','Hauser'),('USA','ID','Western USA','Hayden'),('USA','ID','Western USA','Hayden Lake'),('USA','ID','Western USA','Hazleton'),('USA','ID','Western USA','Heyburn'),('USA','ID','Western USA','Hollister'),('USA','ID','Western USA','Homedale'),('USA','ID','Western USA','Hope'),('USA','ID','Western USA','Horseshoe Bend'),('USA','ID','Western USA','Huetter'),('USA','ID','Western USA','Idaho City'),('USA','ID','Western USA','Idaho Falls'),('USA','ID','Western USA','Inkom'),('USA','ID','Western USA','Iona'),('USA','ID','Western USA','Irwin')," + 
                "('USA','ID','Western USA','Island Park'),('USA','ID','Western USA','Jerome'),('USA','ID','Western USA','Juliaetta'),('USA','ID','Western USA','Kamiah'),('USA','ID','Western USA','Kellogg'),('USA','ID','Western USA','Kendrick'),('USA','ID','Western USA','Ketchum'),('USA','ID','Western USA','Kimberly'),('USA','ID','Western USA','Kooskia'),('USA','ID','Western USA','Kootenai'),('USA','ID','Western USA','Kuna'),('USA','ID','Western USA','Lapwai'),('USA','ID','Western USA','Lava Hot Springs'),('USA','ID','Western USA','Lewiston'),('USA','ID','Western USA','Lewisville'),('USA','ID','Western USA','Mackay'),('USA','ID','Western USA','Malad City'),('USA','ID','Western USA','Malta'),('USA','ID','Western USA','Marsing'),('USA','ID','Western USA','McCall'),('USA','ID','Western USA','McCammon'),('USA','ID','Western USA','Melba'),('USA','ID','Western USA','Menan'),('USA','ID','Western USA','Meridian'),('USA','ID','Western USA','Middleton'),('USA','ID','Western USA','Midvale'),('USA','ID','Western USA','Minidoka'),('USA','ID','Western USA','Montpelier'),('USA','ID','Western USA','Moore'),('USA','ID','Western USA','Moscow'),('USA','ID','Western USA','Mountain Home'),('USA','ID','Western USA','Moyie Springs'),('USA','ID','Western USA','Mud Lake'),('USA','ID','Western USA','Mullan'),('USA','ID','Western USA','Murtaugh'),('USA','ID','Western USA','Nampa'),('USA','ID','Western USA','New Meadows'),('USA','ID','Western USA','New Plymouth'),('USA','ID','Western USA','Newdale'),('USA','ID','Western USA','Nezperce'),('USA','ID','Western USA','Notus'),('USA','ID','Western USA','Oakley'),('USA','ID','Western USA','Oldtown')," + 
                "('USA','ID','Western USA','Onaway'),('USA','ID','Western USA','Orofino'),('USA','ID','Western USA','Osburn'),('USA','ID','Western USA','Paris'),('USA','ID','Western USA','Parker'),('USA','ID','Western USA','Parma'),('USA','ID','Western USA','Paul'),('USA','ID','Western USA','Payette'),('USA','ID','Western USA','Peck'),('USA','ID','Western USA','Pierce'),('USA','ID','Western USA','Pinehurst'),('USA','ID','Western USA','Plummer'),('USA','ID','Western USA','Pocatello'),('USA','ID','Western USA','Ponderay'),('USA','ID','Western USA','Post Falls'),('USA','ID','Western USA','Potlatch'),('USA','ID','Western USA','Preston'),('USA','ID','Western USA','Priest River'),('USA','ID','Western USA','Rathdrum'),('USA','ID','Western USA','Rexburg'),('USA','ID','Western USA','Richfield'),('USA','ID','Western USA','Rigby'),('USA','ID','Western USA','Riggins'),('USA','ID','Western USA','Ririe'),('USA','ID','Western USA','Roberts'),('USA','ID','Western USA','Rockland'),('USA','ID','Western USA','Rupert'),('USA','ID','Western USA','Salmon'),('USA','ID','Western USA','Sandpoint'),('USA','ID','Western USA','Shelley'),('USA','ID','Western USA','Shoshone'),('USA','ID','Western USA','Smelterville'),('USA','ID','Western USA','Soda Springs'),('USA','ID','Western USA','Spirit Lake'),('USA','ID','Western USA','Star'),('USA','ID','Western USA','Stites'),('USA','ID','Western USA','St. Anthony'),('USA','ID','Western USA','St. Charles'),('USA','ID','Western USA','St. Maries'),('USA','ID','Western USA','Sugar City'),('USA','ID','Western USA','Sun Valley'),('USA','ID','Western USA','Swan Valley'),('USA','ID','Western USA','Tensed')," + 
                "('USA','ID','Western USA','Teton'),('USA','ID','Western USA','Tetonia'),('USA','ID','Western USA','Troy'),('USA','ID','Western USA','Twin Falls'),('USA','ID','Western USA','Ucon'),('USA','ID','Western USA','Victor'),('USA','ID','Western USA','Wallace'),('USA','ID','Western USA','Wardner'),('USA','ID','Western USA','Weippe'),('USA','ID','Western USA','Weiser'),('USA','ID','Western USA','Wendell'),('USA','ID','Western USA','Weston'),('USA','ID','Western USA','White Bird'),('USA','ID','Western USA','Wilder'),('USA','ID','Western USA','Winchester'),('USA','ID','Western USA','Worley')");
            //Illinois
            db.ExecuteSql("Insert into northAmerica Values('USA','IL','Midwestern USA','Abingdon'),('USA','IL','Midwestern USA','Addieville'),('USA','IL','Midwestern USA','Addison'),('USA','IL','Midwestern USA','Albany'),('USA','IL','Midwestern USA','Albers'),('USA','IL','Midwestern USA','Albion'),('USA','IL','Midwestern USA','Aledo'),('USA','IL','Midwestern USA','Alexis'),('USA','IL','Midwestern USA','Algonquin'),('USA','IL','Midwestern USA','Alhambra'),('USA','IL','Midwestern USA','Allendale'),('USA','IL','Midwestern USA','Allerton'),('USA','IL','Midwestern USA','Alma'),('USA','IL','Midwestern USA','Alorton'),('USA','IL','Midwestern USA','Alpha'),('USA','IL','Midwestern USA','Alsip'),('USA','IL','Midwestern USA','Altamont'),('USA','IL','Midwestern USA','Alto Pass'),('USA','IL','Midwestern USA','Alton'),('USA','IL','Midwestern USA','Altona'),('USA','IL','Midwestern USA','Alvan'),('USA','IL','Midwestern USA','Amboy'),('USA','IL','Midwestern USA','Andalusia'),('USA','IL','Midwestern USA','Andover'),('USA','IL','Midwestern USA','Anna'),('USA','IL','Midwestern USA','Annawan'),('USA','IL','Midwestern USA','Antioch'),('USA','IL','Midwestern USA','Apple River'),('USA','IL','Midwestern USA','Arcola'),('USA','IL','Midwestern USA','Arenzville'),('USA','IL','Midwestern USA','Argenta'),('USA','IL','Midwestern USA','Arlington Heights'),('USA','IL','Midwestern USA','Armington'),('USA','IL','Midwestern USA','Aroma Park'),('USA','IL','Midwestern USA','Arrowsmith'),('USA','IL','Midwestern USA','Arthur'),('USA','IL','Midwestern USA','Ashkum'),('USA','IL','Midwestern USA','Ashland'),('USA','IL','Midwestern USA','Ashley')," + 
                "('USA','IL','Midwestern USA','Ashmore'),('USA','IL','Midwestern USA','Ashton'),('USA','IL','Midwestern USA','Assumption'),('USA','IL','Midwestern USA','Astoria'),('USA','IL','Midwestern USA','Athens'),('USA','IL','Midwestern USA','Atkinson'),('USA','IL','Midwestern USA','Atlanta'),('USA','IL','Midwestern USA','Atwood'),('USA','IL','Midwestern USA','Auburn'),('USA','IL','Midwestern USA','Augusta'),('USA','IL','Midwestern USA','Aurora'),('USA','IL','Midwestern USA','Ava'),('USA','IL','Midwestern USA','Aviston'),('USA','IL','Midwestern USA','Avon'),('USA','IL','Midwestern USA','Baldwin'),('USA','IL','Midwestern USA','Bannockburn'),('USA','IL','Midwestern USA','Bardolph'),('USA','IL','Midwestern USA','Barrington'),('USA','IL','Midwestern USA','Barrington Hills'),('USA','IL','Midwestern USA','Barry'),('USA','IL','Midwestern USA','Bartelso'),('USA','IL','Midwestern USA','Barlett'),('USA','IL','Midwestern USA','Bortonville'),('USA','IL','Midwestern USA','Batavia'),('USA','IL','Midwestern USA','Bath'),('USA','IL','Midwestern USA','Bay View Gardens'),('USA','IL','Midwestern USA','Beach Park'),('USA','IL','Midwestern USA','Beardstown'),('USA','IL','Midwestern USA','Beaverville'),('USA','IL','Midwestern USA','Beckemeyer'),('USA','IL','Midwestern USA','Bedford Park'),('USA','IL','Midwestern USA','Beecher'),('USA','IL','Midwestern USA','Beecher City'),('USA','IL','Midwestern USA','Belgium'),('USA','IL','Midwestern USA','Belle River'),('USA','IL','Midwestern USA','Belleville'),('USA','IL','Midwestern USA','Bellevue'),('USA','IL','Midwestern USA','Bellflower'),('USA','IL','Midwestern USA','Bellmont')," + 
                "('USA','IL','Midwestern USA','Bellwood'),('USA','IL','Midwestern USA','Belvidere'),('USA','IL','Midwestern USA','Bement'),('USA','IL','Midwestern USA','Benld'),('USA','IL','Midwestern USA','Bensenville'),('USA','IL','Midwestern USA','Benson'),('USA','IL','Midwestern USA','Benton'),('USA','IL','Midwestern USA','Berkely'),('USA','IL','Midwestern USA','Berwyn'),('USA','IL','Midwestern USA','Bethalto'),('USA','IL','Midwestern USA','Bethany'),('USA','IL','Midwestern USA','Big Rock'),('USA','IL','Midwestern USA','Biggsville'),('USA','IL','Midwestern USA','Bismarck'),('USA','IL','Midwestern USA','Blandinsville'),('USA','IL','Midwestern USA','Bloomingdale'),('USA','IL','Midwestern USA','Bloomington'),('USA','IL','Midwestern USA','Blue Island'),('USA','IL','Midwestern USA','Blue Mound'),('USA','IL','Midwestern USA','Bluffs'),('USA','IL','Midwestern USA','Bluford'),('USA','IL','Midwestern USA','Bolingbrook'),('USA','IL','Midwestern USA','Bondville'),('USA','IL','Midwestern USA','Bonfield'),('USA','IL','Midwestern USA','Bonnie'),('USA','IL','Midwestern USA','Bourbonnais'),('USA','IL','Midwestern USA','Bowen'),('USA','IL','Midwestern USA','Braceville'),('USA','IL','Midwestern USA','Bradford'),('USA','IL','Midwestern USA','Bradley'),('USA','IL','Midwestern USA','Braidwood'),('USA','IL','Midwestern USA','Breese'),('USA','IL','Midwestern USA','Bridgeport'),('USA','IL','Midwestern USA','Bridgeview'),('USA','IL','Midwestern USA','Brighton'),('USA','IL','Midwestern USA','Brimfield'),('USA','IL','Midwestern USA','Broadlands'),('USA','IL','Midwestern USA','Broadview'),('USA','IL','Midwestern USA','Brocton')," + 
                "('USA','IL','Midwestern USA','Brookfield'),('USA','IL','Midwestern USA','Brooklyn'),('USA','IL','Midwestern USA','Brookport'),('USA','IL','Midwestern USA','Brownstown'),('USA','IL','Midwestern USA','Buckingham'),('USA','IL','Midwestern USA','Buckley'),('USA','IL','Midwestern USA','Buckner'),('USA','IL','Midwestern USA','Buda'),('USA','IL','Midwestern USA','Buffalo'),('USA','IL','Midwestern USA','Buffalo Grove'),('USA','IL','Midwestern USA','Bull Valley'),('USA','IL','Midwestern USA','Bunker Hill'),('USA','IL','Midwestern USA','Burbank'),('USA','IL','Midwestern USA','Bureau Junction'),('USA','IL','Midwestern USA','Burlington'),('USA','IL','Midwestern USA','Burnham'),('USA','IL','Midwestern USA','Burr Ridge'),('USA','IL','Midwestern USA','Bush'),('USA','IL','Midwestern USA','Bushnell'),('USA','IL','Midwestern USA','Byron'),('USA','IL','Midwestern USA','Cabery'),('USA','IL','Midwestern USA','Cahokia'),('USA','IL','Midwestern USA','Cairo'),('USA','IL','Midwestern USA','Calumet City'),('USA','IL','Midwestern USA','Calemut Park'),('USA','IL','Midwestern USA','Camargo'),('USA','IL','Midwestern USA','Cambria'),('USA','IL','Midwestern USA','Cambridge'),('USA','IL','Midwestern USA','Camp Point'),('USA','IL','Midwestern USA','Campbell Hill'),('USA','IL','Midwestern USA','Campton Hills'),('USA','IL','Midwestern USA','Canton'),('USA','IL','Midwestern USA','Capron'),('USA','IL','Midwestern USA','Carbon Cliff'),('USA','IL','Midwestern USA','Carbon Hill'),('USA','IL','Midwestern USA','Carbondale'),('USA','IL','Midwestern USA','Carlinville'),('USA','IL','Midwestern USA','Carlock'),('USA','IL','Midwestern USA','Carlyle')," + 
                "('USA','IL','Midwestern USA','Carmi'),('USA','IL','Midwestern USA','Carol Stream'),('USA','IL','Midwestern USA','Carpentersville'),('USA','IL','Midwestern USA','Carrier Mills'),('USA','IL','Midwestern USA','Carrollton'),('USA','IL','Midwestern USA','Cartervill'),('USA','IL','Midwestern USA','Carthage'),('USA','IL','Midwestern USA','Cary'),('USA','IL','Midwestern USA','Casey'),('USA','IL','Midwestern USA','Caseyville'),('USA','IL','Midwestern USA','Catlin'),('USA','IL','Midwestern USA','Cave-In-Rock'),('USA','IL','Midwestern USA','Cedar Point'),('USA','IL','Midwestern USA','Cedarville'),('USA','IL','Midwestern USA','Central City'),('USA','IL','Midwestern USA','Centralia'),('USA','IL','Midwestern USA','Centreville'),('USA','IL','Midwestern USA','Cerro Gordo'),('USA','IL','Midwestern USA','Chadwick'),('USA','IL','Midwestern USA','Champaign'),('USA','IL','Midwestern USA','Chandlerville'),('USA','IL','Midwestern USA','Channahon'),('USA','IL','Midwestern USA','Chapin'),('USA','IL','Midwestern USA','Charleston'),('USA','IL','Midwestern USA','Chatham'),('USA','IL','Midwestern USA','Chatsworth'),('USA','IL','Midwestern USA','Chebanse'),('USA','IL','Midwestern USA','Chenoa'),('USA','IL','Midwestern USA','Cherry'),('USA','IL','Midwestern USA','Cherry Valley'),('USA','IL','Midwestern USA','Chester'),('USA','IL','Midwestern USA','Chicago Heights'),('USA','IL','Midwestern USA','Chicago Ridge'),('USA','IL','Midwestern USA','Chicago'),('USA','IL','Midwestern USA','Chillicothe'),('USA','IL','Midwestern USA','Chrisman'),('USA','IL','Midwestern USA','Christopher'),('USA','IL','Midwestern USA','Cicero')," + 
                "('USA','IL','Midwestern USA','Cisco'),('USA','IL','Midwestern USA','Cisne'),('USA','IL','Midwestern USA','Cissna Park'),('USA','IL','Midwestern USA','Clarendon Hills'),('USA','IL','Midwestern USA','Clay City'),('USA','IL','Midwestern USA','Clayton'),('USA','IL','Midwestern USA','Clifton'),('USA','IL','Midwestern USA','Clinton'),('USA','IL','Midwestern USA','Coal City'),('USA','IL','Midwestern USA','Coal Valley'),('USA','IL','Midwestern USA','Coalton'),('USA','IL','Midwestern USA','Cobden'),('USA','IL','Midwestern USA','Coffeen'),('USA','IL','Midwestern USA','Colchester'),('USA','IL','Midwestern USA','Colfax'),('USA','IL','Midwestern USA','Collinsville'),('USA','IL','Midwestern USA','Colona'),('USA','IL','Midwestern USA','Columbia'),('USA','IL','Midwestern USA','Compton'),('USA','IL','Midwestern USA','Congerville'),('USA','IL','Midwestern USA','Cordova'),('USA','IL','Midwestern USA','Cornell'),('USA','IL','Midwestern USA','Cortland'),('USA','IL','Midwestern USA','Coulterville'),('USA','IL','Midwestern USA','Country Club Hills'),('USA','IL','Midwestern USA','Countryside'),('USA','IL','Midwestern USA','Cowden'),('USA','IL','Midwestern USA','Crainville'),('USA','IL','Midwestern USA','Creal Springs'),('USA','IL','Midwestern USA','Crescent City'),('USA','IL','Midwestern USA','Crest Hill'),('USA','IL','Midwestern USA','Creston'),('USA','IL','Midwestern USA','Crestwood'),('USA','IL','Midwestern USA','Crete'),('USA','IL','Midwestern USA','Creve Coeur'),('USA','IL','Midwestern USA','Crossville'),('USA','IL','Midwestern USA','Crystal Lake'),('USA','IL','Midwestern USA','Cuba'),('USA','IL','Midwestern USA','Cullom')," + 
                "('USA','IL','Midwestern USA','Cutler'),('USA','IL','Midwestern USA','Dahlgren'),('USA','IL','Midwestern USA','Dakota'),('USA','IL','Midwestern USA','Dallas City'),('USA','IL','Midwestern USA','Dalton City'),('USA','IL','Midwestern USA','Dalzell'),('USA','IL','Midwestern USA','Damiansville'),('USA','IL','Midwestern USA','Danforfth'),('USA','IL','Midwestern USA','Danvers'),('USA','IL','Midwestern USA','Danville'),('USA','IL','Midwestern USA','Darien'),('USA','IL','Midwestern USA','Davis'),('USA','IL','Midwestern USA','Davis Junction'),('USA','IL','Midwestern USA','Dawson'),('USA','IL','Midwestern USA','De Land'),('USA','IL','Midwestern USA','De Pue'),('USA','IL','Midwestern USA','De Soto'),('USA','IL','Midwestern USA','Decatur'),('USA','IL','Midwestern USA','Deer Creek'),('USA','IL','Midwestern USA','Deer Park'),('USA','IL','Midwestern USA','Deerfield'),('USA','IL','Midwestern USA','DeKalb'),('USA','IL','Midwestern USA','Delavan'),('USA','IL','Midwestern USA','Des Plaines'),('USA','IL','Midwestern USA','Diamond'),('USA','IL','Midwestern USA','Dieterich'),('USA','IL','Midwestern USA','Divernon'),('USA','IL','Midwestern USA','Dix'),('USA','IL','Midwestern USA','Dixmoor'),('USA','IL','Midwestern USA','Dixon'),('USA','IL','Midwestern USA','Dolton'),('USA','IL','Midwestern USA','Dongola'),('USA','IL','Midwestern USA','Donovan'),('USA','IL','Midwestern USA','Dowell'),('USA','IL','Midwestern USA','Downers Grove'),('USA','IL','Midwestern USA','Downs'),('USA','IL','Midwestern USA','Du Quoin'),('USA','IL','Midwestern USA','Dunfermline'),('USA','IL','Midwestern USA','Dunlap'),('USA','IL','Midwestern USA','Dupo')," + 
                "('USA','IL','Midwestern USA','Durand'),('USA','IL','Midwestern USA','Dwight'),('USA','IL','Midwestern USA','Earlville'),('USA','IL','Midwestern USA','East Alton'),('USA','IL','Midwestern USA','East Cape Girardeau'),('USA','IL','Midwestern USA','East Carondelet'),('USA','IL','Midwestern USA','East Dubuque'),('USA','IL','Midwestern USA','East Dundee'),('USA','IL','Midwestern USA','East Galesburg'),('USA','IL','Midwestern USA','East Gillespie'),('USA','IL','Midwestern USA','East Hazel Crest'),('USA','IL','Midwestern USA','East Moline'),('USA','IL','Midwestern USA','East Peoria'),('USA','IL','Midwestern USA','East St. Louis'),('USA','IL','Midwestern USA','Easton'),('USA','IL','Midwestern USA','Edgewood'),('USA','IL','Midwestern USA','Edinburg'),('USA','IL','Midwestern USA','Edwardsville'),('USA','IL','Midwestern USA','Effingham'),('USA','IL','Midwestern USA','El Paso'),('USA','IL','Midwestern USA','Elburn'),('USA','IL','Midwestern USA','Eldorado'),('USA','IL','Midwestern USA','Elgin'),('USA','IL','Midwestern USA','Elizabeth'),('USA','IL','Midwestern USA','Elizabethtown'),('USA','IL','Midwestern USA','Elk Grove Village'),('USA','IL','Midwestern USA','Elkhart'),('USA','IL','Midwestern USA','Elkville'),('USA','IL','Midwestern USA','Elliott'),('USA','IL','Midwestern USA','Ellis Grove'),('USA','IL','Midwestern USA','Elmhurst'),('USA','IL','Midwestern USA','Elmwood'),('USA','IL','Midwestern USA','Elmwood Park'),('USA','IL','Midwestern USA','Elsah'),('USA','IL','Midwestern USA','Elwood'),('USA','IL','Midwestern USA','Emden'),('USA','IL','Midwestern USA','Energy'),('USA','IL','Midwestern USA','Enfield')," + 
                "('USA','IL','Midwestern USA','Equality'),('USA','IL','Midwestern USA','Erie'),('USA','IL','Midwestern USA','Essex'),('USA','IL','Midwestern USA','Eureka'),('USA','IL','Midwestern USA','Evanston'),('USA','IL','Midwestern USA','Evansville'),('USA','IL','Midwestern USA','Evergreen Park'),('USA','IL','Midwestern USA','Ewing'),('USA','IL','Midwestern USA','Fairbury'),('USA','IL','Midwestern USA','Fairfield'),('USA','IL','Midwestern USA','Fairmont City'),('USA','IL','Midwestern USA','Fairmount'),('USA','IL','Midwestern USA','Fareview'),('USA','IL','Midwestern USA','Fairview Heights'),('USA','IL','Midwestern USA','Farina'),('USA','IL','Midwestern USA','Farmer City'),('USA','IL','Midwestern USA','Farmersville'),('USA','IL','Midwestern USA','Farmington'),('USA','IL','Midwestern USA','Fayetteville'),('USA','IL','Midwestern USA','Fillmore'),('USA','IL','Midwestern USA','Findlay'),('USA','IL','Midwestern USA','Fisher'),('USA','IL','Midwestern USA','Fithian'),('USA','IL','Midwestern USA','Flanagan'),('USA','IL','Midwestern USA','Flat Rock'),('USA','IL','Midwestern USA','Flora'),('USA','IL','Midwestern USA','Flossmoor'),('USA','IL','Midwestern USA','Ford Heights'),('USA','IL','Midwestern USA','Forest Park'),('USA','IL','Midwestern USA','Forest View'),('USA','IL','Midwestern USA','Forrest'),('USA','IL','Midwestern USA','Forreston'),('USA','IL','Midwestern USA','Forsyth'),('USA','IL','Midwestern USA','Fox Lake'),('USA','IL','Midwestern USA','Fox River Grove'),('USA','IL','Midwestern USA','Frankfort'),('USA','IL','Midwestern USA','Franklin'),('USA','IL','Midwestern USA','Franklin Grove')," + 
                "('USA','IL','Midwestern USA','Franklin Park'),('USA','IL','Midwestern USA','Freeburg'),('USA','IL','Midwestern USA','Freeman Spur'),('USA','IL','Midwestern USA','Freeport'),('USA','IL','Midwestern USA','Fulton'),('USA','IL','Midwestern USA','Galatia'),('USA','IL','Midwestern USA','Galena'),('USA','IL','Midwestern USA','Galesburg'),('USA','IL','Midwestern USA','Galva'),('USA','IL','Midwestern USA','Gardner'),('USA','IL','Midwestern USA','Geneseo'),('USA','IL','Midwestern USA','Geneva'),('USA','IL','Midwestern USA','Genoa'),('USA','IL','Midwestern USA','Georgetown'),('USA','IL','Midwestern USA','German Valley'),('USA','IL','Midwestern USA','Germantown'),('USA','IL','Midwestern USA','Germantown Hills'),('USA','IL','Midwestern USA','Gibson City'),('USA','IL','Midwestern USA','Gifford'),('USA','IL','Midwestern USA','Gilberts'),('USA','IL','Midwestern USA','Gillespie'),('USA','IL','Midwestern USA','Gilman'),('USA','IL','Midwestern USA','Girard'),('USA','IL','Midwestern USA','Gladstone'),('USA','IL','Midwestern USA','Glasford'),('USA','IL','Midwestern USA','Glen Carbon'),('USA','IL','Midwestern USA','Glen Ellyn'),('USA','IL','Midwestern USA','Glencoe'),('USA','IL','Midwestern USA','Glendale Heights'),('USA','IL','Midwestern USA','Glenview'),('USA','IL','Midwestern USA','Glenwood'),('USA','IL','Midwestern USA','Godfrey'),('USA','IL','Midwestern USA','Godley'),('USA','IL','Midwestern USA','Golconda'),('USA','IL','Midwestern USA','Golden'),('USA','IL','Midwestern USA','Golf'),('USA','IL','Midwestern USA','Good Hope'),('USA','IL','Midwestern USA','Goodfield'),('USA','IL','Midwestern USA','Goreville')," +
                "('USA','IL','Midwestern USA','Grafton'),('USA','IL','Midwestern USA','Grand Ridge'),('USA','IL','Midwestern USA','Grand Tower'),('USA','IL','Midwestern USA','Grandview'),('USA','IL','Midwestern USA','Granite City'),('USA','IL','Midwestern USA','Grant Park'),('USA','IL','Midwestern USA','Grantfork'),('USA','IL','Midwestern USA','Granville'),('USA','IL','Midwestern USA','Grayslake'),('USA','IL','Midwestern USA','Grayville'),('USA','IL','Midwestern USA','Green Oaks'),('USA','IL','Midwestern USA','Green Valley'),('USA','IL','Midwestern USA','Greenfield'),('USA','IL','Midwestern USA','Greenup'),('USA','IL','Midwestern USA','Greenview'),('USA','IL','Midwestern USA','Greenville'),('USA','IL','Midwestern USA','Greenwood'),('USA','IL','Midwestern USA','Gridley'),('USA','IL','Midwestern USA','Griggsville'),('USA','IL','Midwestern USA','Gurnee'),('USA','IL','Midwestern USA','Hainesville'),('USA','IL','Midwestern USA','Hamel'),('USA','IL','Midwestern USA','Hamilton'),('USA','IL','Midwestern USA','Hammond'),('USA','IL','Midwestern USA','Hampshire'),('USA','IL','Midwestern USA','Hampton'),('USA','IL','Midwestern USA','Hanaford'),('USA','IL','Midwestern USA','Hanna City'),('USA','IL','Midwestern USA','Hanover'),('USA','IL','Midwestern USA','Hanover Park'),('USA','IL','Midwestern USA','Hardin'),('USA','IL','Midwestern USA','Harrisburg'),('USA','IL','Midwestern USA','Harristown'),('USA','IL','Midwestern USA','Hartford'),('USA','IL','Midwestern USA','Hartsburg'),('USA','IL','Midwestern USA','Havard'),('USA','IL','Midwestern USA','Harvey'),('USA','IL','Midwestern USA','Harwood Heights'),('USA','IL','Midwestern USA','Havana')," + 
                "('USA','IL','Midwestern USA','Hawthorn Woods'),('USA','IL','Midwestern USA','Hazel Crest'),('USA','IL','Midwestern USA','Hebron'),('USA','IL','Midwestern USA','Hecker'),('USA','IL','Midwestern USA','Henderson'),('USA','IL','Midwestern USA','Hennepin'),('USA','IL','Midwestern USA','Henry'),('USA','IL','Midwestern USA','Herrick'),('USA','IL','Midwestern USA','Herrin'),('USA','IL','Midwestern USA','Herscher'),('USA','IL','Midwestern USA','Heyworth'),('USA','IL','Midwestern USA','Hickory Hills'),('USA','IL','Midwestern USA','Highland'),('USA','IL','Midwestern USA','Highland Park'),('USA','IL','Midwestern USA','Highwood'),('USA','IL','Midwestern USA','Hillcrest'),('USA','IL','Midwestern USA','Hillsboro'),('USA','IL','Midwestern USA','Hillsdale'),('USA','IL','Midwestern USA','Hillside'),('USA','IL','Midwestern USA','Hinckley'),('USA','IL','Midwestern USA','Hindsboro'),('USA','IL','Midwestern USA','Hinsdale'),('USA','IL','Midwestern USA','Hodgkins'),('USA','IL','Midwestern USA','Hoffman'),('USA','IL','Midwestern USA','Hoffman Estates'),('USA','IL','Midwestern USA','Holiday Hills'),('USA','IL','Midwestern USA','Homer'),('USA','IL','Midwestern USA','Homer Glen'),('USA','IL','Midwestern USA','Hometown'),('USA','IL','Midwestern USA','Homewood'),('USA','IL','Midwestern USA','Hoopeston'),('USA','IL','Midwestern USA','Hopedale'),('USA','IL','Midwestern USA','Hopewell'),('USA','IL','Midwestern USA','Hopkins Park'),('USA','IL','Midwestern USA','Hoyleton'),('USA','IL','Midwestern USA','Hudson'),('USA','IL','Midwestern USA','Hull'),('USA','IL','Midwestern USA','Humboldt'),('USA','IL','Midwestern USA','Hume')," + 
                "('USA','IL','Midwestern USA','Huntley'),('USA','IL','Midwestern USA','Hurst'),('USA','IL','Midwestern USA','Hutsonville'),('USA','IL','Midwestern USA','Illiopolis'),('USA','IL','Midwestern USA','Ina'),('USA','IL','Midwestern USA','Indian Creek'),('USA','IL','Midwestern USA','Indian Head Park'),('USA','IL','Midwestern USA','Indianola'),('USA','IL','Midwestern USA','Industry'),('USA','IL','Midwestern USA','Inverness'),('USA','IL','Midwestern USA','Ipava'),('USA','IL','Midwestern USA','Irving'),('USA','IL','Midwestern USA','Irvington'),('USA','IL','Midwestern USA','Island Lake'),('USA','IL','Midwestern USA','Itasca'),('USA','IL','Midwestern USA','Iuka'),('USA','IL','Midwestern USA','Ivesdale'),('USA','IL','Midwestern USA','Jacksonville'),('USA','IL','Midwestern USA','Jeffersonville'),('USA','IL','Midwestern USA','Jerome'),('USA','IL','Midwestern USA','Jerseyville'),('USA','IL','Midwestern USA','Jewett'),('USA','IL','Midwestern USA','Johnsburg'),('USA','IL','Midwestern USA','Honston City'),('USA','IL','Midwestern USA','Joliet'),('USA','IL','Midwestern USA','Jonesboro'),('USA','IL','Midwestern USA','Joppa'),('USA','IL','Midwestern USA','Joy'),('USA','IL','Midwestern USA','Junction City'),('USA','IL','Midwestern USA','Justice'),('USA','IL','Midwestern USA','Kampsville'),('USA','IL','Midwestern USA','Kane'),('USA','IL','Midwestern USA','Kaneville'),('USA','IL','Midwestern USA','Kankakee'),('USA','IL','Midwestern USA','Kansas'),('USA','IL','Midwestern USA','Karnak'),('USA','IL','Midwestern USA','Keithsburg'),('USA','IL','Midwestern USA','Kenilworth'),('USA','IL','Midwestern USA','Kenney')," + 
                "('USA','IL','Midwestern USA','Kewanee'),('USA','IL','Midwestern USA','Keyesport'),('USA','IL','Midwestern USA','Kilbourne'),('USA','IL','Midwestern USA','Kildeer'),('USA','IL','Midwestern USA','Kincaid'),('USA','IL','Midwestern USA','Kingston'),('USA','IL','Midwestern USA','Kingston Mines'),('USA','IL','Midwestern USA','Kinmundy'),('USA','IL','Midwestern USA','Kirkland'),('USA','IL','Midwestern USA','Kirkwood'),('USA','IL','Midwestern USA','Knoxville'),('USA','IL','Midwestern USA','La Grange'),('USA','IL','Midwestern USA','La Grange Park'),('USA','IL','Midwestern USA','La Harpe'),('USA','IL','Midwestern USA','La Moille'),('USA','IL','Midwestern USA','Lacon'),('USA','IL','Midwestern USA','Ladd'),('USA','IL','Midwestern USA','Lake Barrington'),('USA','IL','Midwestern USA','Lake Bluff'),('USA','IL','Midwestern USA','Lake Forest'),('USA','IL','Midwestern USA','Lake in the Hills'),('USA','IL','Midwestern USA','Lake Villa'),('USA','IL','Midwestern USA','Lake Zurich'),('USA','IL','Midwestern USA','Lakemoor'),('USA','IL','Midwestern USA','Lakewood'),('USA','IL','Midwestern USA','Lanark'),('USA','IL','Midwestern USA','Lansing'),('USA','IL','Midwestern USA','LaSalle'),('USA','IL','Midwestern USA','Latham'),('USA','IL','Midwestern USA','Lawrenceville'),('USA','IL','Midwestern USA','Le Roy'),('USA','IL','Midwestern USA','Leaf River'),('USA','IL','Midwestern USA','Lebanon'),('USA','IL','Midwestern USA','Lee'),('USA','IL','Midwestern USA','Leland'),('USA','IL','Midwestern USA','Leland Grove'),('USA','IL','Midwestern USA','Lemont'),('USA','IL','Midwestern USA','Lena'),('USA','IL','Midwestern USA','Lenzburg')," + 
                "('USA','IL','Midwestern USA','Lerna'),('USA','IL','Midwestern USA','Lewistown'),('USA','IL','Midwestern USA','Lexington'),('USA','IL','Midwestern USA','Liberty'),('USA','IL','Midwestern USA','Libertyville'),('USA','IL','Midwestern USA','Lily Lake'),('USA','IL','Midwestern USA','Limestone'),('USA','IL','Midwestern USA','Lincolnshire'),('USA','IL','Midwestern USA','Lincolnwood'),('USA','IL','Midwestern USA','Lincoln'),('USA','IL','Midwestern USA','Lindenhurst'),('USA','IL','Midwestern USA','Lisbon'),('USA','IL','Midwestern USA','Lisle'),('USA','IL','Midwestern USA','Litchfield'),('USA','IL','Midwestern USA','Little York'),('USA','IL','Midwestern USA','Livingston'),('USA','IL','Midwestern USA','Loami'),('USA','IL','Midwestern USA','Lockport'),('USA','IL','Midwestern USA','Loda'),('USA','IL','Midwestern USA','Lomax'),('USA','IL','Midwestern USA','Lombard'),('USA','IL','Midwestern USA','London Mills'),('USA','IL','Midwestern USA','Long Creek'),('USA','IL','Midwestern USA','Long Grove'),('USA','IL','Midwestern USA','Loraine'),('USA','IL','Midwestern USA','Lostant'),('USA','IL','Midwestern USA','Louisville'),('USA','IL','Midwestern USA','Loves Park'),('USA','IL','Midwestern USA','Lovington'),('USA','IL','Midwestern USA','Ludlow'),('USA','IL','Midwestern USA','Lyndon'),('USA','IL','Midwestern USA','Lynwood'),('USA','IL','Midwestern USA','Lyons'),('USA','IL','Midwestern USA','Machesney Park'),('USA','IL','Midwestern USA','Mackinaw'),('USA','IL','Midwestern USA','Macomb'),('USA','IL','Midwestern USA','Macon'),('USA','IL','Midwestern USA','Madison'),('USA','IL','Midwestern USA','Magnolia')," +
                "('USA','IL','Midwestern USA','Mahomet'),('USA','IL','Midwestern USA','Makanda'),('USA','IL','Midwestern USA','Malden'),('USA','IL','Midwestern USA','Malta'),('USA','IL','Midwestern USA','Manchester'),('USA','IL','Midwestern USA','Manhattan'),('USA','IL','Midwestern USA','Manito'),('USA','IL','Midwestern USA','Manlius'),('USA','IL','Midwestern USA','Mansfield'),('USA','IL','Midwestern USA','Manteno'),('USA','IL','Midwestern USA','Maple Park'),('USA','IL','Midwestern USA','Mapleton'),('USA','IL','Midwestern USA','Maquon'),('USA','IL','Midwestern USA','Marengo'),('USA','IL','Midwestern USA','Marine'),('USA','IL','Midwestern USA','Marion'),('USA','IL','Midwestern USA','Marissa'),('USA','IL','Midwestern USA','Mark'),('USA','IL','Midwestern USA','Markham'),('USA','IL','Midwestern USA','Maroa'),('USA','IL','Midwestern USA','Marquette Heights'),('USA','IL','Midwestern USA','Marseilles'),('USA','IL','Midwestern USA','Marshall'),('USA','IL','Midwestern USA','Martinsville'),('USA','IL','Midwestern USA','Martinton'),('USA','IL','Midwestern USA','Maryville'),('USA','IL','Midwestern USA','Mascoutah'),('USA','IL','Midwestern USA','Mason'),('USA','IL','Midwestern USA','Mason City'),('USA','IL','Midwestern USA','Matherville'),('USA','IL','Midwestern USA','Matteson'),('USA','IL','Midwestern USA','Mattoon'),('USA','IL','Midwestern USA','Maywood'),('USA','IL','Midwestern USA','Mazon'),('USA','IL','Midwestern USA','McClure'),('USA','IL','Midwestern USA','McCullom Lake'),('USA','IL','Midwestern USA','McHenry'),('USA','IL','Midwestern USA','McLean'),('USA','IL','Midwestern USA','McLeansboro'),('USA','IL','Midwestern USA','McNabb')," + 
                "('USA','IL','Midwestern USA','Mechanicsburg'),('USA','IL','Midwestern USA','Medora'),('USA','IL','Midwestern USA','Melrose Park'),('USA','IL','Midwestern USA','Melvin'),('USA','IL','Midwestern USA','Mendon'),('USA','IL','Midwestern USA','Mendota'),('USA','IL','Midwestern USA','Meredosia'),('USA','IL','Midwestern USA','Merrionette Park'),('USA','IL','Midwestern USA','Metamora'),('USA','IL','Midwestern USA','Metropolis'),('USA','IL','Midwestern USA','Mettawa'),('USA','IL','Midwestern USA','Middletown'),('USA','IL','Midwestern USA','Midlothian'),('USA','IL','Midwestern USA','Milan'),('USA','IL','Midwestern USA','Milford'),('USA','IL','Midwestern USA','Millbrook'),('USA','IL','Midwestern USA','Milledgeville'),('USA','IL','Midwestern USA','Millington'),('USA','IL','Midwestern USA','Millstadt'),('USA','IL','Midwestern USA','Milton'),('USA','IL','Midwestern USA','Minier'),('USA','IL','Midwestern USA','Minonk'),('USA','IL','Midwestern USA','Minooka'),('USA','IL','Midwestern USA','Mokena'),('USA','IL','Midwestern USA','Moline'),('USA','IL','Midwestern USA','Momence'),('USA','IL','Midwestern USA','Monee'),('USA','IL','Midwestern USA','Monmouth'),('USA','IL','Midwestern USA','Monroe Center'),('USA','IL','Midwestern USA','Montgomery'),('USA','IL','Midwestern USA','Monticello'),('USA','IL','Midwestern USA','Morrisonville'),('USA','IL','Midwestern USA','Morrison'),('USA','IL','Midwestern USA','Morris'),('USA','IL','Midwestern USA','Morton'),('USA','IL','Midwestern USA','Morton Grove'),('USA','IL','Midwestern USA','Mound City'),('USA','IL','Midwestern USA','Mounds'),('USA','IL','Midwestern USA','Mount Auburn')," + 
                "('USA','IL','Midwestern USA','Mount Carmel'),('USA','IL','Midwestern USA','Mount Carroll'),('USA','IL','Midwestern USA','Mount Clare'),('USA','IL','Midwestern USA','Mount Morris'),('USA','IL','Midwestern USA','Mount Olive'),('USA','IL','Midwestern USA','Mount Prospect'),('USA','IL','Midwestern USA','Mount Pulaski'),('USA','IL','Midwestern USA','Mount Sterling'),('USA','IL','Midwestern USA','Mount Vernon'),('USA','IL','Midwestern USA','Mount Zion'),('USA','IL','Midwestern USA','Moweaqua'),('USA','IL','Midwestern USA','Mulberry Grove'),('USA','IL','Midwestern USA','Mundelein'),('USA','IL','Midwestern USA','Murphysboro'),('USA','IL','Midwestern USA','Murrayville'),('USA','IL','Midwestern USA','Naperville'),('USA','IL','Midwestern USA','Naplate'),('USA','IL','Midwestern USA','Nashville'),('USA','IL','Midwestern USA','Nauvoo'),('USA','IL','Midwestern USA','Nebo'),('USA','IL','Midwestern USA','Neoga'),('USA','IL','Midwestern USA','Neponset'),('USA','IL','Midwestern USA','New Athens'),('USA','IL','Midwestern USA','New Baden'),('USA','IL','Midwestern USA','New Berlin'),('USA','IL','Midwestern USA','New Boston'),('USA','IL','Midwestern USA','New Canton'),('USA','IL','Midwestern USA','New Douglas'),('USA','IL','Midwestern USA','New Haven'),('USA','IL','Midwestern USA','New Holland'),('USA','IL','Midwestern USA','New Lenox'),('USA','IL','Midwestern USA','New Milford'),('USA','IL','Midwestern USA','New Windsor'),('USA','IL','Midwestern USA','Newark'),('USA','IL','Midwestern USA','Newman'),('USA','IL','Midwestern USA','Newton'),('USA','IL','Midwestern USA','Niantic'),('USA','IL','Midwestern USA','Niles')," + 
                "('USA','IL','Midwestern USA','Noble'),('USA','IL','Midwestern USA','Nokomis'),('USA','IL','Midwestern USA','Normal'),('USA','IL','Midwestern USA','Norridge'),('USA','IL','Midwestern USA','Norris City'),('USA','IL','Midwestern USA','North Aurora'),('USA','IL','Midwestern USA','North Barrington'),('USA','IL','Midwestern USA','North Chicago'),('USA','IL','Midwestern USA','North City'),('USA','IL','Midwestern USA','North Pekin'),('USA','IL','Midwestern USA','North Riverside'),('USA','IL','Midwestern USA','North Utica'),('USA','IL','Midwestern USA','Northbrook'),('USA','IL','Midwestern USA','Northfield'),('USA','IL','Midwestern USA','Northlake'),('USA','IL','Midwestern USA','Norwood'),('USA','IL','Midwestern USA','O\'Fallon'),('USA','IL','Midwestern USA','Oak Brook'),('USA','IL','Midwestern USA','Oak Forest'),('USA','IL','Midwestern USA','Oak Grove'),('USA','IL','Midwestern USA','Oak Lawn'),('USA','IL','Midwestern USA','Oak Park'),('USA','IL','Midwestern USA','Oakbrook Terrace'),('USA','IL','Midwestern USA','Oakford'),('USA','IL','Midwestern USA','Oakland'),('USA','IL','Midwestern USA','Oakwood'),('USA','IL','Midwestern USA','Oakwood Hill'),('USA','IL','Midwestern USA','Oblong'),('USA','IL','Midwestern USA','Odell'),('USA','IL','Midwestern USA','Odin'),('USA','IL','Midwestern USA','Ogden'),('USA','IL','Midwestern USA','Oglesby'),('USA','IL','Midwestern USA','Ohio'),('USA','IL','Midwestern USA','Okawville'),('USA','IL','Midwestern USA','Olmstead'),('USA','IL','Midwestern USA','Olney'),('USA','IL','Midwestern USA','Olympia Fields'),('USA','IL','Midwestern USA','Omaha'),('USA','IL','Midwestern USA','Onargo')," + 
                "('USA','IL','Midwestern USA','Oneida'),('USA','IL','Midwestern USA','Oquawka'),('USA','IL','Midwestern USA','Orangeville'),('USA','IL','Midwestern USA','Oreana'),('USA','IL','Midwestern USA','Oregon'),('USA','IL','Midwestern USA','Orient'),('USA','IL','Midwestern USA','Orion'),('USA','IL','Midwestern USA','Orland Hills'),('USA','IL','Midwestern USA','Orland Park'),('USA','IL','Midwestern USA','Oswego'),('USA','IL','Midwestern USA','Ottawa'),('USA','IL','Midwestern USA','Palatine'),('USA','IL','Midwestern USA','Palestine'),('USA','IL','Midwestern USA','Palmyra'),('USA','IL','Midwestern USA','Palos Heights'),('USA','IL','Midwestern USA','Palos Hills'),('USA','IL','Midwestern USA','Palos Park'),('USA','IL','Midwestern USA','Pana'),('USA','IL','Midwestern USA','Panama'),('USA','IL','Midwestern USA','Paris'),('USA','IL','Midwestern USA','Park City'),('USA','IL','Midwestern USA','Park Forest'),('USA','IL','Midwestern USA','Park Ridge'),('USA','IL','Midwestern USA','Patoka'),('USA','IL','Midwestern USA','Paw Paw'),('USA','IL','Midwestern USA','Pawnee'),('USA','IL','Midwestern USA','Paxton'),('USA','IL','Midwestern USA','Payson'),('USA','IL','Midwestern USA','Pearl City'),('USA','IL','Midwestern USA','Pecatonica'),('USA','IL','Midwestern USA','Pekin'),('USA','IL','Midwestern USA','Peoria Heights'),('USA','IL','Midwestern USA','Peoria'),('USA','IL','Midwestern USA','Peotone'),('USA','IL','Midwestern USA','Percy'),('USA','IL','Midwestern USA','Peru'),('USA','IL','Midwestern USA','Pesotum'),('USA','IL','Midwestern USA','Petersburg'),('USA','IL','Midwestern USA','Philo'),('USA','IL','Midwestern USA','Phoenix')," + 
                "('USA','IL','Midwestern USA','Pierron'),('USA','IL','Midwestern USA','Pinckneyville'),('USA','IL','Midwestern USA','Pingree Grove'),('USA','IL','Midwestern USA','Piper City'),('USA','IL','Midwestern USA','Pittsburg'),('USA','IL','Midwestern USA','Pittsfield'),('USA','IL','Midwestern USA','Plainfield'),('USA','IL','Midwestern USA','Plainville'),('USA','IL','Midwestern USA','Plano'),('USA','IL','Midwestern USA','Pleasant Hill'),('USA','IL','Midwestern USA','Pleasant Plains'),('USA','IL','Midwestern USA','Plymouth'),('USA','IL','Midwestern USA','Pocahontas'),('USA','IL','Midwestern USA','Polo'),('USA','IL','Midwestern USA','Pontiac'),('USA','IL','Midwestern USA','Pontoon Beach'),('USA','IL','Midwestern USA','Poplar Grove'),('USA','IL','Midwestern USA','Port Barrington'),('USA','IL','Midwestern USA','Port Byron'),('USA','IL','Midwestern USA','Posen'),('USA','IL','Midwestern USA','Potomac'),('USA','IL','Midwestern USA','Prairie City'),('USA','IL','Midwestern USA','Prairie du Rocher'),('USA','IL','Midwestern USA','Prairie Grove'),('USA','IL','Midwestern USA','Princeton'),('USA','IL','Midwestern USA','Princeville'),('USA','IL','Midwestern USA','Prophetstown'),('USA','IL','Midwestern USA','Prospect Heights'),('USA','IL','Midwestern USA','Quincy'),('USA','IL','Midwestern USA','Raleigh'),('USA','IL','Midwestern USA','Ramsey'),('USA','IL','Midwestern USA','Rankin'),('USA','IL','Midwestern USA','Ransom'),('USA','IL','Midwestern USA','Rantoul'),('USA','IL','Midwestern USA','Rapids City'),('USA','IL','Midwestern USA','Raymond'),('USA','IL','Midwestern USA','Red Bud'),('USA','IL','Midwestern USA','Reynolds')," + 
                "('USA','IL','Midwestern USA','Richmonds'),('USA','IL','Midwestern USA','Richton Park'),('USA','IL','Midwestern USA','Ridge Farm'),('USA','IL','Midwestern USA','Ridgeway'),('USA','IL','Midwestern USA','Ringwood'),('USA','IL','Midwestern USA','River Forest'),('USA','IL','Midwestern USA','River Grove'),('USA','IL','Midwestern USA','Riverdale'),('USA','IL','Midwestern USA','Riverside'),('USA','IL','Midwestern USA','Riverton'),('USA','IL','Midwestern USA','Riverwoods'),('USA','IL','Midwestern USA','Roanoke'),('USA','IL','Midwestern USA','Robbins'),('USA','IL','Midwestern USA','Roberts'),('USA','IL','Midwestern USA','Robinson'),('USA','IL','Midwestern USA','Rochelle'),('USA','IL','Midwestern USA','Rochester'),('USA','IL','Midwestern USA','Rock City'),('USA','IL','Midwestern USA','Rock Falls'),('USA','IL','Midwestern USA','Rock Island'),('USA','IL','Midwestern USA','Rockdale'),('USA','IL','Midwestern USA','Rockford'),('USA','IL','Midwestern USA','Rockton'),('USA','IL','Midwestern USA','Rolling Meadows'),('USA','IL','Midwestern USA','Romeoville'),('USA','IL','Midwestern USA','Roodhouse'),('USA','IL','Midwestern USA','Roscoe'),('USA','IL','Midwestern USA','Roselle'),('USA','IL','Midwestern USA','Rosemont'),('USA','IL','Midwestern USA','Roseville'),('USA','IL','Midwestern USA','Rosiclare'),('USA','IL','Midwestern USA','Rossville'),('USA','IL','Midwestern USA','Round Lake'),('USA','IL','Midwestern USA','Round Lake Beach'),('USA','IL','Midwestern USA','Round Lake Heights'),('USA','IL','Midwestern USA','Round Lake Park'),('USA','IL','Midwestern USA','Roxana'),('USA','IL','Midwestern USA','Royal')," + 
                "('USA','IL','Midwestern USA','Royalton'),('USA','IL','Midwestern USA','Ruma'),('USA','IL','Midwestern USA','Rushville'),('USA','IL','Midwestern USA','Rutland'),('USA','IL','Midwestern USA','Sadorus'),('USA','IL','Midwestern USA','Salem'),('USA','IL','Midwestern USA','Sammons Point'),('USA','IL','Midwestern USA','San Jose'),('USA','IL','Midwestern USA','Sandoval'),('USA','IL','Midwestern USA','Sandwich'),('USA','IL','Midwestern USA','Sauk Village'),('USA','IL','Midwestern USA','Saunemin'),('USA','IL','Midwestern USA','Savanna'),('USA','IL','Midwestern USA','Savoy'),('USA','IL','Midwestern USA','Sawyerville'),('USA','IL','Midwestern USA','Saybrook'),('USA','IL','Midwestern USA','Scales Mound'),('USA','IL','Midwestern USA','Schaumburg'),('USA','IL','Midwestern USA','Schiller Park'),('USA','IL','Midwestern USA','Schram City'),('USA','IL','Midwestern USA','Seatonville'),('USA','IL','Midwestern USA','Secor'),('USA','IL','Midwestern USA','Seneca'),('USA','IL','Midwestern USA','Sesser'),('USA','IL','Midwestern USA','Shabbona'),('USA','IL','Midwestern USA','Shannon'),('USA','IL','Midwestern USA','Shawneetown'),('USA','IL','Midwestern USA','Sheffield'),('USA','IL','Midwestern USA','Shelbyville'),('USA','IL','Midwestern USA','Sheldon'),('USA','IL','Midwestern USA','Sheridan'),('USA','IL','Midwestern USA','Sherman'),('USA','IL','Midwestern USA','Sherrard'),('USA','IL','Midwestern USA','Shiloh'),('USA','IL','Midwestern USA','Shipman'),('USA','IL','Midwestern USA','Shorewood'),('USA','IL','Midwestern USA','Sibley'),('USA','IL','Midwestern USA','Sidell'),('USA','IL','Midwestern USA','Sidney')," + 
                "('USA','IL','Midwestern USA','Sigel'),('USA','IL','Midwestern USA','Silvis'),('USA','IL','Midwestern USA','Springfield')");
            //Indiana
            db.ExecuteSql("Insert into northAmerica Values('USA','IN','Midwestern USA','Indianapolis')");
            //Iowa
            db.ExecuteSql("Insert into northAmerica Values('USA','IA','Midwestern USA','Des Moines')");
            //Kansas
            db.ExecuteSql("Insert into northAmerica Values('USA','KS','Midwestern USA','Topeka'),('USA','KS','Midwestern USA','Wichita')");
            //Kentucky
            db.ExecuteSql("Insert into northAmerica Values('USA','KY','Southern USA','Frankfort'),('USA','KY','Southern USA','Louisville')");
            //Louisiana
            db.ExecuteSql("Insert into northAmerica Values('USA','LA','Southern USA','Baton Rouge'),('USA','LA','Southern USA','New Orleans')");
            //Maine
            db.ExecuteSql("Insert into northAmerica Values('USA','ME','Northeastern USA','Augusta'),('USA','ME','Northeastern USA','Portland')");
            //Maryland
            db.ExecuteSql("Insert into northAmerica Values('USA','MD','Southern USA','Annapolis'),('USA','MD','Southern USA','Baltimore')");
            //Massachusetts
            db.ExecuteSql("Insert into northAmerica Values('USA','MA','Northeastern USA','Boston')");
            //Michigan
            db.ExecuteSql("Insert into northAmerica Values('USA','MI','Midwestern USA','Detroit'),('USA','MI','Midwestern USA','Lansing')");
            //Minnesota
            db.ExecuteSql("Insert into northAmerica Values('USA','MN','Midwestern USA','Minneapolis'),('USA','MN','Midwestern USA','St. Paul')");
            //Mississippi
            db.ExecuteSql("Insert into northAmerica Values('USA','MS','Midwestern USA','Jackson')");
            //Missouri
            db.ExecuteSql("Insert into northAmerica Values('USA','MO','Midwestern USA','Jefferson City'),('USA','MO','Midwestern USA','Kansas City')");
            //Montana
            db.ExecuteSql("Insert into northAmerica Values('USA','MT','Western USA','Billings'),('USA','MT','Western USA','Helena')");
            //Nebraska
            db.ExecuteSql("Insert into northAmerica Values('USA','NE','Midwestern USA','Lincoln'),('USA','NE','Midwestern USA','Omaha')");
            //Nevada
            db.ExecuteSql("Insert into northAmerica Values('USA','NV','Western USA','Carson City'),('USA','NV','Western USA','Las Vegas')");
            //New Hampshire
            db.ExecuteSql("Insert into northAmerica Values('USA','NH','Northeastern USA','Concord'),('USA','NH','Northeastern USA','Manchester')");
            //New Jersey
            db.ExecuteSql("Insert into northAmerica Values('USA','NJ','Northeastern USA','Newark'),('USA','NJ','Northeastern USA','Trenton')");
            //New Mexico
            db.ExecuteSql("Insert into northAmerica Values('USA','NM','Western USA','Albuquerque'),('USA','NM','Western USA','Santa Fe')");
            //New York
            db.ExecuteSql("Insert into northAmerica Values('USA','NY','Northeastern USA','Albany'),('USA','NY','Northeastern USA','New York City')");
            //North Carolina
            db.ExecuteSql("Insert into northAmerica Values('USA','NC','Southern USA','Charlotte'),('USA','NC','Southern USA','Raleigh')");
            //North Dakota
            db.ExecuteSql("Insert into northAmerica Values('USA','ND','Midwestern USA','Bismarck'),('USA','ND','Midwestern USA','Fargo')");
            //Ohio
            db.ExecuteSql("Insert into northAmerica Values('USA','OH','Midwestern USA','Columbus')");
            //Oklahoma
            db.ExecuteSql("Insert into northAmerica Values('USA','OK','Southern USA','Oklahoma City')");
            //Oregon
            db.ExecuteSql("Insert into northAmerica Values('USA','OR','Western USA','Portland'),('USA','OR','Western USA','Salem')");
            //Pennsylvania
            db.ExecuteSql("Insert into northAmerica Values('USA','PA','Northeastern USA','Harrisburg'),('USA','PA','Northeastern USA','Philadelphia')");
            //Rhode Island
            db.ExecuteSql("Insert into northAmerica Values('USA','RI','Northeastern USA','Providence')");
            //South Carolina
            db.ExecuteSql("Insert into northAmerica Values('USA','SC','Southern USA','Charleston'),('USA','SC','Southern USA','Columbia')");
            //South Dakota
            db.ExecuteSql("Insert into northAmerica Values('USA','SD','Midwestern USA','Pierre'),('USA','SD','Midwestern USA','Sioux Falls')");
            //Tennessee
            db.ExecuteSql("Insert into northAmerica Values('USA','TN','Southern USA','Nashville')");
            //Texas
            db.ExecuteSql("Insert into northAmerica Values('USA','TX','Southern USA','Austin'),('USA','TX','Southern USA','Houston')");
            //Utah
            db.ExecuteSql("Insert into northAmerica Values('USA','UT','Western USA','Salt Lake City')");
            //Vermont
            db.ExecuteSql("Insert into northAmerica Values('USA','VT','Northeastern USA','Burlington'),('USA','VT','Northeastern USA','Montpelier')");
            //Virginia
            db.ExecuteSql("Insert into northAmerica Values('USA','VA','Southern USA','Richmond'),('USA','VA','Southern USA','Virginia Beach')");
            //Washington
            db.ExecuteSql("Insert into northAmerica Values('USA','WA','Western USA','Olympia'),('USA','WA','Western USA','Seattle')");
            //Washington D.C.
            db.ExecuteSql("Insert into northAmerica Values('USA','WDC','Southern USA','District of Columbia')");
            //West Virginia
            db.ExecuteSql("Insert into northAmerica Values('USA','WV','Southern USA','Charleston')");
            //Wisconsin
            db.ExecuteSql("Insert into northAmerica Values('USA','WI','Midwestern USA','Madison'),('USA','WI','Midwestern USA','Milwaukee')");
            //Wyoming
            db.ExecuteSql("Insert into northAmerica Values('USA','WY','Western USA','Cheyenne')");
        }
        dataCanada();
        dataUSA();
        app.ShowPopup("All done");
    } else {
        if(startRend == 0){
            app.ShowPopup("Starting N. American Countries");
        } else {
            app.ShowPopup("Ending N. American Countries");
        }
    }
}
function locationDataCA(results){
    var len = results.rows.length;
    if(len == 0){
        
    } else {
        if(startRend == 0){
            app.ShowPopup("Starting C. American Countries");
        } else {
            app.ShowPopup("Ending C. American Countries");
        }
    }
}
function locationDataSA(results){
    var len = results.rows.length;
    if(len == 0){
        
    } else {
        if(startRend == 0){
            app.ShowPopup("Starting S. American Countries");
        } else {
            app.ShowPopup("Ending S. American Countries");
        }
    }
}
function locationDataAsia(results){
    var len = results.rows.length;
    if(len == 0){
        
    } else {
        if(startRend == 0){
            app.ShowPopup("Starting Asian Countries");
        } else {
            app.ShowPopup("Ending Asian Countries");
        }
    }
}
function locationDataAfrica(results){
    var len = results.rows.length;
    if(len == 0){
        
    } else {
        if(startRend == 0){
            app.ShowPopup("Starting African Countries");
        } else {
            app.ShowPopup("Ending African Countries");
        }
    }
}
function locationDataEurope(results){
    var len = results.rows.length;
    if(len == 0){
        
    } else {
        if(startRend == 0){
            app.ShowPopup("Starting European Countries");
        } else {
            app.ShowPopup("Ending European Countries");
        }
    }
}
function locationDataOceania(results){
    var len = results.rows.length;
    if(len == 0){
        
    } else {
        if(startRend == 0){
            app.ShowPopup("Starting Oceanian Countries");
        } else {
            app.ShowPopup("Ending Oceanian Countries");
        }
    }
}