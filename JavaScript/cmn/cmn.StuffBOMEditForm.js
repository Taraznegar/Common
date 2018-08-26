(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return cmn.StuffBOMEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._StuffLookupControl = that.FindControl("StuffFieldControl").FindControl("InnerControl");          
            that.FetchedStuffs = [];
            that.ComponentsEntityList = null;        

            var entity = that._BindableEntity.GetEntity();

            if (!entity.FieldExists("StuffBOM_StuffComponents"))
                entity.AddField("StuffBOM_StuffComponents");

            if (that._FormMode == "New") {
                if (ValueIsEmpty(entity.GetFieldValue("StuffBOM_StuffComponents"))) {
                    that.ComponentsEntityList = afw.uiApi.CreateEntityList("cmn.StuffBOM_StuffComponent");
                    entity.SetFieldValue("StuffBOM_StuffComponents", that.ComponentsEntityList);
                }
                else
                    that.ComponentsEntityList = entity.GetFieldValue("StuffBOM_StuffComponents");
            }
            else {
                if (ValueIsEmpty(entity.GetFieldValue("StuffBOM_StuffComponents"))) {
                    that.ComponentsEntityList = afw.uiApi.FetchEntityList("cmn.StuffBOM_StuffComponent",
                        String.Format("StuffBOM = '{0}'",
                        that._BindableEntity.get("ID")), "RowNumber", null, null, ["Stuff.StuffDef"]);
                    entity.SetFieldValue("StuffBOM_StuffComponents", that.ComponentsEntityList);
                }
                else
                    that.ComponentsEntityList = entity.GetFieldValue("StuffBOM_StuffComponents");
            }

            that._CreateStuffComponentsGrid();
        },

        _CreateStuffComponentsGrid: function () {
            var that = this;

            that._StuffComponentsGridControl = new cmn.StuffBOM_StuffComponentsGridControl({
                ParentControl: that._MainDockPanel.Panes[2],
                Name: "StuffComponentsGridControl",
                ParentEditForm: that,
                RowsEntityList: that.ComponentsEntityList
            });

            if (that.ComponentsEntityList.Entities.length == 0)
                that._StuffComponentsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < that.ComponentsEntityList.Entities.length; i++) {
                    that._StuffComponentsGridControl.AddRow(that.ComponentsEntityList.Entities[i]);
                }
            }
        },
            
        _GetStuff_StuffDef: function () {
            var that = this;

            var entity = that._BindableEntity.GetEntity();

            if (ValueIsEmpty(entity.GetFieldValue("Stuff"))) {
                return null;
            }
            else {
                var foundStuff = $.grep(that.FetchedStuffs,
                    function (o) { return o.GetFieldValue("ID") == entity.GetFieldValue("Stuff"); });

                if (foundStuff.length != 0)
                    return foundStuff[0].GetFieldValue("StuffDef_Entity");
                else {
                    var fetchedStuff = afw.uiApi.FetchEntityByID("cmn.Stuff", entity.GetFieldValue("Stuff"), ["StuffDef"]);
                    that.FetchedStuffs.push(fetchedStuff);
                    return fetchedStuff.GetFieldValue("StuffDef_Entity");
                }
            }
        },

        _OnOpening: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpening.call(that);
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            setTimeout(function () {
                that._StuffLookupControl.Focus();
            }, 600);
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);      
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            
            if (!that._StuffComponentsGridControl.ValidateRows())
                return false;

            return true;
        },

        GetFormMode: function () {
            var that = this;

            return that._FormMode;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            if (saved) {
                for (var i = 0; i < that.ComponentsEntityList.Entities.length; i++)
                    that.ComponentsEntityList.Entities[i].ChangeStatus = "None";
            }

            return saved;
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.StuffBOMEditForm";
    FormClass.BaseType = afw.EntityWindowBase;


    cmn.StuffBOMEditForm = FormClass;
})();