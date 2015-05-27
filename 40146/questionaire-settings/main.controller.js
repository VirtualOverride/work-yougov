var CiQuestionaire;
(function(CiQuestionaire){
	'use strict';

	var controller = (function(){

		controller.$inject = ["$scope", "$rootScope", "$modal", "$http", "util_commonPopups"];

		function controller($scope, $rootScope, $modal, $http, commonPopup){
	        $scope.openSurveySetting = function(){
	            $modal.open({
	                templateUrl: "main-surveyGlobalSetting.html",
	                backdrop: false,
	                keyboard: false
	            });
	        };

	        $scope.openVersionControl = function () {
	            $modal.open({
	                templateUrl: "editSurvey/versionControl/versionControl.html",
	                controller: 'versionControlCtr',
	                size: "lg",
	                backdrop: false,
	                keyboard: false
	            });
	        };

	        $scope.toggleTopNavigationBar = function(){
	            $rootScope.globalUI.isHideTopNavigationBar = !$rootScope.globalUI.isHideTopNavigationBar;
	        };

	        $scope.openSearchBox = function(){
	            $("#searchBox").toggleClass("slideToShow");
	        };

	        $scope.openFindAndReplace = function(){
	            $modal.open({
	                templateUrl: "editSurvey/findAndReplace/findAndReplace.html",
	                controller: 'findAndReplaceCtr',
	                keyboard: false,
	                backdrop: false
	            });
	        };

	        $scope.openCSVTool = function(){

	            if(!$rootScope.editor.isMainEditor){
	                commonPopup.openAlertPopup("This function is temporarily only for questionnaire owner");
	            } else {
	                $modal.open({
	                    templateUrl: "editSurvey/readFromCSV/readFromCSV.html",
	                    controller: 'csvService',
	                    backdrop: false,
	                    keyboard: false
	                });
	            }
	        };

	        var previousPreviewWindow;

	        $scope.generateScript = function(){

	            $http.post("/api/generateGryphonScript", $rootScope.survey)
	                .success(function(data){
	                    var previewWindow = window.open("editSurvey/scriptPreview/scriptPreview.html", "_blank");
	                    if(previewWindow){
	                        previewWindow.script = data.script;
	                        if(previousPreviewWindow){
	                            previousPreviewWindow.close();
	                        }
	                        previousPreviewWindow = previewWindow;
	                    } else {
	                        alert("Please allow pop up from this website to preview the generated script");
	                    }

	                });
	        };

	        function generateDownloadableHrefExcel(){
	            function generateDownloadableHref(text) {
	                var data = new Blob([text], {type: 'application/excel'});
	                // If we are replacing a previously generated file we need to
	                // manually revoke the object URL to avoid memory leaks.
	                if ($scope.excelHref !== "") {
	                    window.URL.revokeObjectURL($scope.excelHref);
	                }
	                return window.URL.createObjectURL(data);
	            }
	            function getSurveyData(){
	                function XlsBuilder(){
	                    var content=[];
	                    var tempCell="";
	                    var tempRow=[];
	                    var row= 0,col=0;
	                    this.appendHTMLText = function(text){
	                        if(text!=undefined && text!=null){
	                            tempCell+=text.replace(/<(?:.|\n)*?>/gm, " ");
	                        }
	                        return this;
	                    };

	                    this.append = function(text){
	                        if(text!=undefined && text!=null) {
	                            tempCell+=text;
	                        }
	                        return this;
	                    };

	                    this.separate = function(){
	                        tempCell+=" ";
	                        return this;
	                    };

	                    this.nextRow = function(){
	                        this.nextColumn();
	                        content.push(tempRow.slice(0)); //push a copy of the row
	                        tempRow = []; //clear the row
	                        row++;
	                        col=0;
	                        return this;
	                    };
	                    this.nextColumn = function(){
	                        tempRow.push(tempCell+"");//clone tempCell
	                        tempCell = "";
	                        col++;
	                        return this;
	                    };
	                    this.currentRow = function(){
	                        return row;
	                    };
	                    this.currentColumn = function(){
	                        return col;
	                    };
	                    this.getContent = function(){
	                        return content;
	                    };
	                }
	                var bldr = new XlsBuilder();

	                console.log($scope.survey);
	                var modules = $scope.survey.modules;
	                for(var m=0;m<modules.length;m++){
	                    var module = modules[m];
	                    var pages = module.pages;
	                    for(var p=0;p<pages.length;p++){
	                        var page = pages[p];
	                        var questions = page.questions;
	                        for(var q=0;q<questions.length;q++){
	                            var question = questions[q];
	                            var rows = question.rows;
	                            var columns = question.columns;
	                            bldr.append(question.config.referenceName).nextColumn()
	                                .append("["+(question.type).toUpperCase()+"]").separate().appendHTMLText(question.text).nextRow();
	                            for(var rc=0;rc<Math.max(rows.length, columns.length);rc++){
	                                var row = rows[rc];
	                                var column = columns[rc];
	                                if(row){ //if there is a row on a particular counter then write the row
	                                    bldr.append(row.config.referenceName).nextColumn()
	                                        .append(row.text).nextColumn()
	                                        .append(row.config.otherSpecify? "Text Response": "").nextColumn();
	                                }else{//otherwise occupy space (meaning there are more columns than rows)
	                                    bldr.nextColumn().nextColumn().nextColumn();
	                                }
	                                if(column){
	                                    bldr.append(column.config.referenceName).nextColumn()
	                                        .append(column.text).nextColumn()
	                                        .append(column.config.otherSpecify? "Text Response": "").nextColumn();
	                                }
	                                bldr.nextRow();
	                            }
	                            bldr.nextRow();
	                        }
	                    }
	                }
	                return bldr.getContent();
	            }
	            function generateSheetFromArray(data) {
	                var ws = {};
	                var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
	                for(var R = 0; R != data.length; ++R) {
	                    for(var C = 0; C != data[R].length; ++C) {
	                        if(range.s.r > R) range.s.r = R;
	                        if(range.s.c > C) range.s.c = C;
	                        if(range.e.r < R) range.e.r = R;
	                        if(range.e.c < C) range.e.c = C;
	                        var cell = {v: data[R][C] };
	                        if(cell.v == null) continue;
	                        var cell_ref = XLSX.utils.encode_cell({c:C,r:R});

	                        if(typeof cell.v === 'number') cell.t = 'n';
	                        else if(typeof cell.v === 'boolean') cell.t = 'b';
	                        else cell.t = 's';

	                        ws[cell_ref] = cell;
	                    }
	                }
	                if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
	                return ws;
	            }
	            function Workbook() { //Private class workbook
	                if(!(this instanceof Workbook)) return new Workbook();
	                this.SheetNames = [];
	                this.Sheets = {};
	            }
	            function s2ab(s) {
	                var buf = new ArrayBuffer(s.length);
	                var view = new Uint8Array(buf);
	                for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
	                return buf;
	            }
	            var wb = new Workbook(), ws = generateSheetFromArray(getSurveyData());
	            wb.SheetNames.push("Questionnaire");
	            wb.Sheets["Questionnaire"] = ws;
	            var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
	            return generateDownloadableHref(s2ab(wbout));
	        }

	        function getCustomDate(){ //Returns a date like '01302015' (1/30/2015)
	            return (new Date().toLocaleDateString("en-US").split("/"))
	                .map(function(v){
	                    if((v+"").length==1)
	                        return "0"+v;
	                    else return v;
	                }).join("");
	        }

	        $scope.excelHref = "";
	        $scope.excelFileName = "Survey.xlsx";
	        $scope.updateExcelHref = function(){
	            //$scope.excelHref = generateDownloadableHref(getSurveyAsExcelBlob());
	            $scope.excelHref = generateDownloadableHrefExcel();
	            $scope.excelFileName=$scope.survey.name+"_"+getCustomDate()+".xlsx";
	        };			
		}

		return controller;
	})();

	CiQuestionaire.Controller = controller;

})(CiQuestionaire || (CiQuestionaire = {}));