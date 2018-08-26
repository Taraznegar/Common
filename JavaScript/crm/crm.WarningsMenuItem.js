(function () {
    var typeName = "crm.WarningsMenuItem";
    var baseType = afw.NavBarMenuItem;
    var events = baseType.Events.concat([]);

    var WarningsMenuItem = baseType.extend({
        events: events,

        GetType: function () {
            return crm.WarningsMenuItem;
        },

        init: function (options) {
            var that = this;

            options.Key = "Warnings";
            options.Text = " ";
            options.Type = "CommandExecutionItem";
            options.UnselectedIcon = "resource(cmn.WarningIcon2_Disable)";
            options.SelectedIcon = "resource(cmn.WarningIcon2_Disable)";

            afw.NavBarMenuItem.fn.init.call(that, options);

            that.FindControl("CountLabel").SetText("");

            that._PopupIsOpen = false;
            that._Popup = null;
        },

        _CreateUiElements: function () {
            var that = this;

            //afw.NavBarMenuItem.fn._CreateUiElements.call(that);
            afw.BasePanel.fn._CreateUiElements.call(that);

            var designObjectData = JSON.parse('{"TypeName":"afw.Panel","Name":"Panel1","ChildControls":[{"TypeName":"afw.DockPanel","Name":"WrapperDockPanel","ChildControls":null,"Width":60,"Height":50,"Left":0,"Top":0,"RightToLeft":null,"FillParent":true,"Padding":0,"Visible":true,"BackColor":null,"Orientation":"Horizontal","PanesCount":3,"PanesSettings":[{"Size":"50"},{"Size":"1"},{"Size":"fill"}],"Panes":[{"TypeName":"afw.DockPanelPane","Name":"Pane1","ChildControls":[{"TypeName":"afw.Panel","Name":"Panel2","ChildControls":[{"TypeName":"afw.DockPanel","Name":"DockPanel1","ChildControls":null,"Width":48,"Height":48,"Left":0,"Top":0,"RightToLeft":null,"FillParent":true,"Padding":0,"Visible":true,"BackColor":null,"Orientation":"Vertical","PanesCount":3,"PanesSettings":[{"Size":"5"},{"Size":"fill"},{"Size":"5"}],"Panes":[{"TypeName":"afw.DockPanelPane","Name":"Pane1","ChildControls":null,"Width":48,"Height":5,"Left":0,"Top":0,"RightToLeft":null,"FillParent":false,"Padding":1,"Visible":true,"BackColor":null,"PaneIndex":0},{"TypeName":"afw.DockPanelPane","Name":"Pane2","ChildControls":[{"TypeName":"afw.Panel","Name":"IconPanel","ChildControls":[{"TypeName":"afw.Label","Name":"CountLabel","ChildControls":null,"Width":28,"Height":26,"Left":"0","Top":"10","RightToLeft":null,"FillParent":false,"Padding":0,"TextColor":"#ffffff","BackColor":null,"Text":"0","FontSize":"10","FontBold":true}],"Width":46,"Height":36,"Left":1,"Top":1,"RightToLeft":null,"FillParent":false,"Padding":0,"Visible":true,"BackColor":null,"BorderColor":null,"BorderWidth":0,"BackgroundImage":"resource(cmn.WarningIcon2_Enable1)","BackgroundImageSize":"Default","BackgroundImagePosition":"Center","AutoScroll":false}],"Width":48,"Height":38,"Left":0,"Top":5,"RightToLeft":null,"FillParent":false,"Padding":1,"Visible":true,"BackColor":null,"PaneIndex":1},{"TypeName":"afw.DockPanelPane","Name":"Pane3","ChildControls":null,"Width":48,"Height":5,"Left":0,"Top":43,"RightToLeft":null,"FillParent":false,"Padding":1,"Visible":true,"BackColor":null,"PaneIndex":2}]}],"Width":48,"Height":48,"Left":1,"Top":1,"RightToLeft":null,"FillParent":false,"Padding":0,"Visible":true,"BackColor":null,"BorderColor":null,"BorderWidth":0,"BackgroundImageSize":"Default","BackgroundImagePosition":"Center","AutoScroll":false}],"Width":50,"Height":50,"Left":10,"Top":0,"RightToLeft":null,"FillParent":false,"Padding":1,"Visible":true,"BackColor":null,"PaneIndex":0},{"TypeName":"afw.DockPanelPane","Name":"Pane2","ChildControls":[{"TypeName":"afw.Label","Name":"TextLabel","ChildControls":null,"Width":1,"Height":48,"Left":0,"Top":0,"RightToLeft":null,"FillParent":false,"Padding":0,"TextColor":null,"BackColor":null,"Text":" ","FontBold":false}],"Width":1,"Height":50,"Left":9,"Top":0,"RightToLeft":null,"FillParent":false,"Padding":1,"Visible":true,"BackColor":null,"PaneIndex":1},{"TypeName":"afw.DockPanelPane","Name":"Pane3","ChildControls":null,"Width":9,"Height":50,"Left":0,"Top":0,"RightToLeft":null,"FillParent":false,"Padding":1,"Visible":true,"BackColor":null,"PaneIndex":2}]}],"Width":60,"Height":50,"Left":1,"Top":1,"RightToLeft":null,"FillParent":false,"Padding":0,"Visible":true,"BackColor":null,"BorderColor":null,"BorderWidth":0,"BackgroundImageSize":"Default","BackgroundImagePosition":"Center","AutoScroll":false}');
            var wrapperPanel = afw.uiApi.CreateControlByObjectData(that, designObjectData, false);
            wrapperPanel.SetFillParent(true);
        },

        _OnClick: function () {
            var that = this;

            afw.NavBarMenuItem.fn._OnClick.call(that);

            if (that._PopupIsOpen) {
                that._IsSelected = false;
                that._Popup.Close();
            }
            else {
                that._IsSelected = true;

                that._OpenPopup();
            }
        },

        _OpenPopup: function () {
            var that = this;

            var popup = that._Popup = new afw.Popup({ Name: "WarningsPopup", Width: 280, Height: 115 });
            var popupContentForm = afw.uiApi.CreateSavedFormByName(popup, "crm.WarningPopupForm");

            popup.SetAnchor(that, "bottom left", "top left");
            popup.bind("Closed", function (e) { that._Popup_Closed(e); });
            popup.Open();
            that._PopupIsOpen = true;

            var popupTabControl = popup.FindControl("MainTabControl");
            popupTabControl.SelectTabByIndex(0);

            popup.FindControl("RakedeManLabel").SetMouseCursor("pointer");
            popup.FindControl("RakedeHameLabel").SetMouseCursor("pointer");
            popup.FindControl("MoavagheManLabel").SetMouseCursor("pointer");
            popup.FindControl("MoavagheHameLabel").SetMouseCursor("pointer");

            popup.FindControl("RakedeManLabel").bind("Click", function (e) { that._ItemClicked("RakedeMan"); });
            popup.FindControl("RakedeHameLabel").bind("Click", function (e) { that._ItemClicked("RakedeHame"); });
            popup.FindControl("MoavagheManLabel").bind("Click", function (e) { that._ItemClicked("MoavagheMan"); });
            popup.FindControl("MoavagheHameLabel").bind("Click", function (e) { that._ItemClicked("MoavagheHame"); });

            afw.uiApi.ShowProgress(popup);
            afw.uiApi.CallServerMethodAsync("crm.GetUserWarningItemsCount", null,
                function (result) {
                    afw.uiApi.HideProgress(popup);
                    if (result.HasError)
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    else {
                        var resultEntity = result.Value;

                        var tedadeParvandehayeRakedeMan = resultEntity.GetFieldValue("TedadeParvandehayeRakedeMan");
                        var tedadeParvandehayeRakedeHame = resultEntity.GetFieldValue("TedadeParvandehayeRakedeHame");
                        var tedadeParvandehayeMoavagheMan = resultEntity.GetFieldValue("TedadeParvandehayeMoavagheMan");
                        var tedadeParvandehayeMoavagheHame = resultEntity.GetFieldValue("TedadeParvandehayeMoavagheHame");

                        popupTabControl.GetTabPageByName("RakedTab").SetTabItemText(
                            String.Format("راکد ({0})", tedadeParvandehayeRakedeHame));
                        popupTabControl.GetTabPageByName("MoavaghTab").SetTabItemText(
                            String.Format("معوقه ({0})", tedadeParvandehayeMoavagheHame));

                        that._SetWarningCountIconValue("RakedeMan", tedadeParvandehayeRakedeMan);
                        that._SetWarningCountIconValue("RakedeHame", tedadeParvandehayeRakedeHame);
                        that._SetWarningCountIconValue("MoavagheMan", tedadeParvandehayeMoavagheMan);
                        that._SetWarningCountIconValue("MoavagheHame", tedadeParvandehayeMoavagheHame);
                    }                       
                });
        },

        _SetWarningCountIconValue: function (fieldName, value) {
            var that = this;

            var fieldIconPanel = that._Popup.FindControl(fieldName + "CountIconPanel");
            var fieldIconLabel = that._Popup.FindControl(fieldName + "CountLabel");

            if (value < 100)
                fieldIconPanel.SetBackgroundImage("Resource(cmn.WarningIcon1)");
            else
                fieldIconPanel.SetBackgroundImage("Resource(cmn.WarningIcon1_2)");

            if (value < 10)
                fieldIconLabel.SetWidth(25);
            else if (value >= 10 && value <= 100)
                fieldIconLabel.SetWidth(29);
            else
                fieldIconLabel.SetWidth(29);

            fieldIconLabel.SetText(value);
            fieldIconLabel.SetHeight(35);
        },

        _Popup_Closed: function (e) {
            var that = this;

            that._PopupIsOpen = false;
        },

        SetWarningItemsCount: function (value) {
            var that = this;

            if (value == 0) {
                that._UnselectedIcon = that._SelectedIcon = "resource(cmn.WarningIcon2_Disable)";
                that._IconPanel.SetBackgroundImage(that._UnselectedIcon);
                that.FindControl("CountLabel").SetText("");
            }
            else {
                var countLabel = that.FindControl("CountLabel");

                if (value < 100) {
                    that._UnselectedIcon = that._SelectedIcon = "resource(cmn.WarningIcon2_Enable1)";

                    if (value < 10)
                        countLabel.SetWidth(28);
                    else
                        countLabel.SetWidth(32);
                }
                else {
                    that._UnselectedIcon = that._SelectedIcon = "resource(cmn.WarningIcon2_Enable2)";
                    countLabel.SetWidth(32);
                }

                that._IconPanel.SetBackgroundImage(that._UnselectedIcon);
                countLabel.SetText(value);
            }
        },

        _ItemClicked: function (itemName) {
            var that = this;

            var salesCasesDataList = afw.DataListHelper.DisplayDataListInAppContainer("crm.SalesCases");
            var dataListFilterControl = salesCasesDataList.FindControl("SalesCasesFilterControl");

            if (itemName == "RakedeMan") {
                dataListFilterControl.SetFilters({
                    MainFilter: "Raked",
                    User: afw.App.Session.GetFieldValue("SystemUser"),
                    RequestType: null,
                    ActiveStatus: null
                });
            }
            else if (itemName == "RakedeHame") {
                dataListFilterControl.SetFilters({
                    MainFilter: "Raked",
                    User: null,
                    RequestType: null,
                    ActiveStatus: null
                });
            }
            else if (itemName == "MoavagheMan") {
                dataListFilterControl.SetFilters({
                    MainFilter: "Moavagh",
                    User: afw.App.Session.GetFieldValue("SystemUser"),
                    RequestType: null,
                    ActiveStatus: null
                });
            }
            else if (itemName == "MoavagheHame") {
                dataListFilterControl.SetFilters({
                    MainFilter: "Moavagh",
                    User: null,
                    RequestType: null,
                    ActiveStatus: null
                });
            }
        },

        _DoDestroy: function () {
            var that = this;

            afw.NavBarMenuItem.fn._DoDestroy.call(that);
        },

        _Toggle: function (selectedState) {
            var that = this;

            afw.NavBarMenuItem.fn._Toggle.call(that, selectedState);
        }
    });

    //Static Members:

    WarningsMenuItem.TypeName = typeName;
    WarningsMenuItem.BaseType = baseType;
    WarningsMenuItem.Events = events;


    crm.WarningsMenuItem = WarningsMenuItem;
})();
