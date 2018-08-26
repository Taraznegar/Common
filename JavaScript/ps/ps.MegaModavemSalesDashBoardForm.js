(function () {
    var objectEvents = afw.BasePanel.Events.concat([]);

    var FormClass = afw.BasePanel.extend({
        events: objectEvents,

        GetType: function () {
            return ps.MegaModavemSalesDashBoardForm;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);
            
            that._MainCategoryLookupControl = that.FindControl("MainCategoryLookupControl");
            that._SubCategoryLookupControl = that.FindControl("SubCategoryLookupControl");
            that._TavanTextBox = that.FindControl("TavanTextBox");
            that._MahdudiatButtryDropDownList = that.FindControl("MahdudiatButtryDropDownList");
            that._NamayeshKalahaDaraMojudiAcbandCheckBox = that.FindControl("NamayeshKalahaDaraMojudiAcbandCheckBox");
            that._ApplyFilterButton = that.FindControl("ApplyFilterButton");
            that._ClearFiltersButton = that.FindControl("ClearFiltersButton");
            that._ShowStuffDefFileButton = that.FindControl("ShowStuffDefFileButton");
            that._DataListPanel = that.FindControl("DataListPanel");

            afw.uiApi.CallServerMethodAsync("cmn.GetMahdudiatBatriEntityLists", [],
                           function (result) {
                               if (that._IsDestroying)
                                   return;

                               afw.uiApi.HideProgress(that);
                               if (result.HasError)
                                   afw.ErrorDialog.Show(result.ErrorMessage);
                               else {
                                   var entites = result.Value.Entities;
                                   var dataSource = [];
                                   for (var i = 0; i < entites.length ; i++) {
                                       var name = entites[i].GetFieldValue("Name");
                                       if (!ValueIsEmpty(name))
                                           dataSource.push({ Name: name, Title: name })
                                   }
                                   that._MahdudiatButtryDropDownList.SetItemsDataSource(dataSource);
                               }
                           });
        

            that._MainCategoryLookupControl.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._SubCategoryLookupControl.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._TavanTextBox.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._MahdudiatButtryDropDownList.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });
            that._NamayeshKalahaDaraMojudiAcbandCheckBox.BindEvent("ValueChanged", function (e) { that._DestroyDataList(e); });

            that._ApplyFilterButton.BindEvent("Click", function (e) { that._ApplyFilterButton_Click(e); });
            that._ClearFiltersButton.BindEvent("Click", function (e) { that._ClearFiltersButton_Click(e); });
            that._ShowStuffDefFileButton.BindEvent("Click", function (e) { that._ShowStuffDefFileButton_Click(e); });

            that._CreateDataList();
        },
        
        _CreateDataList: function () {
            var that = this;

            that._DestroyDataList();

            that._DataList = new afw.uiApi.CreateDataListControl("ps.MegaModavemSalesDashboardDataList", {
                Name: "MegaModavemSalesDashboardDataList",
                ParentControl: that._DataListPanel,
                DashBoardForm: that,
                FillParent: true
            });

            that._DataList.LoadData();
        },

        _DestroyDataList: function () {
            var that = this;

            var dataList = that._DataListPanel.FindControl("MegaModavemSalesDashboardDataList");
            if (dataList != null)
                dataList.Destroy();
        },

        _ApplyFilterButton_Click: function () {
            var that = this;

            that._CreateDataList();
        },

        _ClearFiltersButton_Click: function () {
            var that = this;

            that._MainCategoryLookupControl.SetValue(null);
            that._SubCategoryLookupControl.SetValue(null);
            that._TavanTextBox.SetValue(null);
            that._MahdudiatButtryDropDownList.SetValue(null);
            that._NamayeshKalahaDaraMojudiAcbandCheckBox.SetValue(false);

            that._DataList.LoadData();
        },

        _ShowStuffDefFileButton_Click: function () {
            var that = this;

            var selectedEntities = that._DataList.GetEntitiesGridView().GetSelectedRows();
            if (selectedEntities.length == 0) {
                afw.ErrorDialog.Show("ابتدا یک سطر را انتخاب نمایید.");
                return;
            }

            var stuffDef = afw.uiApi.FetchEntity("cmn.StuffDefs", String.Format("ID = '{0}'", selectedEntities[0].DataItem["StuffDefID"]));
            var specFileName = stuffDef.GetFieldValue("Custom_SpecFileName");
           
            if (ValueIsEmpty(specFileName))
                return;

            var window = new afw.Window( {
                Name: "StuffDefSpecFileWindow",
                Title: "فایل مشخصات کالا",
                Modal: false,
                Width: 1500,
                Height: 1500
            });
            
            var pdfViewer = new afw.PdfViewer({
                Name:  "PdfViewer",
                ParentControl: window,
                FillParent : true,
                PdfFilePath: "StuffDefSpecFiles/" + specFileName + ".pdf"
            });

            window.Open();
            window.Maximize()
        },

        GetFilterExpression: function () {
            var that = this;

            var filterExpression = "";

            if(!ValueIsEmpty(that._MainCategoryLookupControl.GetValue())){
                if(filterExpression != "")
                    filterExpression += " and ";

                filterExpression += String.Format("MainCategory = '{0}'", that._MainCategoryLookupControl.GetValue())
            }

            if (!ValueIsEmpty(that._SubCategoryLookupControl.GetValue())) {
                if (filterExpression != "")
                    filterExpression += " and ";

                filterExpression += String.Format("SubCategory = '{0}'", that._SubCategoryLookupControl.GetValue())
            }

            if (!ValueIsEmpty(that._TavanTextBox.GetValue())) {
                if (filterExpression != "")
                    filterExpression += " and ";

                filterExpression += String.Format("Custom_TavanKva like '%{0}%'", that._TavanTextBox.GetValue())
            }

            if (!ValueIsEmpty(that._MahdudiatButtryDropDownList.GetValue())) {
                if (filterExpression != "")
                    filterExpression += " and ";

                filterExpression += String.Format("Custom_MahdodiateBatri like '%{0}%'", that._MahdudiatButtryDropDownList.GetValue())
            }

            if (that._NamayeshKalahaDaraMojudiAcbandCheckBox.GetValue() == true) {
                if (filterExpression != "")
                    filterExpression += " and ";

               filterExpression += "TedadeAkbandeGhabeleForosh > 0";
            }

            return filterExpression;
        },

        _OnPreviewKeyUp: function (e) {
            var that = this;

            afw.BasePanel.fn._OnPreviewKeyUp.call(that, e);
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "ps.MegaModavemSalesDashBoardForm";
    FormClass.BaseType = afw.BasePanel;
    FormClass.Events = objectEvents;

    ps.MegaModavemSalesDashBoardForm = FormClass;
})();
