(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return cmn.CustomerCategorySelectControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);


            that._BindableEntity = options.RoleInfoEntitiy.ToBindableEntity();
            
            that._CustomerCategoriesEntityList = that._GetCustomerCategoriesEntityList();
            that._CustomerGroupDockPanel = that.FindControl("CustomerGroupDockPanel");
            that._MainGroupPanel = that.FindControl("MainGroupPanel");
            that._SubGroup1Panel = that.FindControl("SubGroup1Panel");
            that._SubGroup2Panel = that.FindControl("SubGroup2Panel");

            that._CustomerGroupingLabel = that.FindControl("CustomerGroupingLabel");
            
            that._CustomerGroupDockPanel.SetPaneSizeSetting(1, 1);
            that._CustomerGroupDockPanel.SetPaneSizeSetting(2, 1);
            that._MainGroupAutoComplete = null;
            that._SubGroup1AutoComplete = null;
            that._SubGroup2AutoComplete = null;

            that._CreateCustomerCategoryDropDownList(that._MainGroupPanel);
            if (that._BindableEntity.GetEntity().GetFieldValue("SubGroup1") != null) {
                that._CustomerGroupDockPanel.SetPaneSizeSetting(1, 40);
                that._CreateCustomerCategoryDropDownList(that._SubGroup1Panel, that._BindableEntity.GetEntity().GetFieldValue("MainGroup"));
                if (that._BindableEntity.GetEntity().GetFieldValue("SubGroup2") != null) {
                    that._CreateCustomerCategoryDropDownList(that._SubGroup2Panel, that._BindableEntity.GetEntity().GetFieldValue("SubGroup1"));
                    that._CustomerGroupDockPanel.SetPaneSizeSetting(2, 40);
                }
            }
            
        },

        _GetCustomerCategoriesEntityList: function () {
            var that = this;

            if (that._CustomerCategoriesEntityList == null)
                return that._CustomerCategoriesEntityList = afw.uiApi.FetchEntityList("cmn.CustomerCategory", null, "LevelNumber");
            else
                return that._CustomerCategoriesEntityList;
        },

        _CreateCustomerCategoryDropDownList: function (parenControl, parentId) {
            var that = this;

            var lastCustomerCategoryDropDownList = parenControl.FindControl("CustomerCategoryDropDownList");
            if (lastCustomerCategoryDropDownList != null)
                lastCustomerCategoryDropDownList.Destroy();
            
            var valueDataMember = null;
            var dropDownListDataSource = null;

            if (parenControl == that._MainGroupPanel) {
                valueDataMember = "MainGroup";
                dropDownListDataSource = $.grep(that._CustomerCategoriesEntityList.ToDataSourceData(),
                    function (o) { return ValueIsIn(o.get("ID"), that._GetMainCategories()); });
                if (dropDownListDataSource.length == 0) {
                    that._CustomerGroupDockPanel.SetPaneSizeSetting(1, 1);
                    that._CustomerGroupDockPanel.SetPaneSizeSetting(2, 1);
                    return;
                }
            }
            else if (parenControl == that._SubGroup1Panel) {
                valueDataMember = "SubGroup1";
                if (parentId != null)
                    dropDownListDataSource = $.grep(that._CustomerCategoriesEntityList.ToDataSourceData(),
                        function (o) { return ValueIsIn(o.get("ID"), that._GetSubsCategories1(parentId)); });
                if (dropDownListDataSource.length == 0) {
                    that._CustomerGroupDockPanel.SetPaneSizeSetting(2, 1);
                    return;
                }
            }
            else if (parenControl == that._SubGroup2Panel) {
                valueDataMember = "SubGroup2";
                if (parentId != null)
                    dropDownListDataSource = $.grep(that._CustomerCategoriesEntityList.ToDataSourceData(),
                        function (o) { return ValueIsIn(o.get("ID"), that._GetSubsCategories2(parentId)); });
            }

            var customerCategoryDropDownList = new afw.DropDownList({
                Name: "CustomerCategoryDropDownList",
                ParentControl: parenControl,
                LabelVisible: false,
                DataTextField: "Name",
                DataValueField: "ID",
                ValueDataMember: valueDataMember
            });

            if (dropDownListDataSource != null)
                customerCategoryDropDownList.SetItemsDataSource(dropDownListDataSource);
            customerCategoryDropDownList.InitDataBinding(that._BindableEntity);
            customerCategoryDropDownList.bind("ValueChanged", function (e) { that._CustomerCategoryDropDownList_ValueChanged(e); });
            customerCategoryDropDownList.SetWidth(210);
        },
        
        _CustomerCategoryDropDownList_ValueChanged: function(e){
            var that = this;

            var categoryId = e.Sender._Value;
            var categoryEntity = that._GetCategoryEntity(categoryId);
            if (categoryEntity != null) {
                if (categoryEntity.GetFieldValue("Parent") != null) {
                    if (categoryEntity.GetFieldValue("LevelNumber") == 2) {
                        that._CreateCustomerCategoryDropDownList(that._SubGroup2Panel, categoryId);
                        that._CustomerGroupDockPanel.SetPaneSizeSetting(2, 40);
                    }
                }
                else {
                    that._CreateCustomerCategoryDropDownList(that._SubGroup1Panel, categoryId);
                    that._CustomerGroupDockPanel.SetPaneSizeSetting(1, 40);
                }
            }
            else {
                var parentControlName = e.Sender.ParentControl.ParentControl.ParentControl.ParentControl.GetName();
                if (parentControlName = "MainGroupPanel") {
                    that._CustomerGroupDockPanel.SetPaneSizeSetting(1, 1);
                    that._CustomerGroupDockPanel.SetPaneSizeSetting(2, 1);
                }
                else if (parentControlName = "SubGroup1Panel")
                    that._CustomerGroupDockPanel.SetPaneSizeSetting(2, 1);
                else if (parentControlName = "SubGroup2Panel")
                    that._CustomerGroupDockPanel.SetPaneSizeSetting(2, 1);
            }
        },

        _GetSubsCategories1: function (parentId) {
            var that = this;

            var subsCategories1IDArray = [];
            for (var i = 0; i < that._CustomerCategoriesEntityList.Entities.length; i++) {
                if (that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("Parent") == parentId)
                    subsCategories1IDArray.push(that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("ID"));
            }
            return subsCategories1IDArray;
        },

        _GetMainCategories: function () {
            var that = this;

            var mainCategoriesIDArray = [];
            for (var i = 0; i < that._CustomerCategoriesEntityList.Entities.length; i++) {
                if (that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("Parent") == null)
                    mainCategoriesIDArray.push(that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("ID"));
            }
            return mainCategoriesIDArray;
        },

        _GetSubsCategories2: function (subCategory1ID) {
            var that = this;

            var subsCategories2IDArray = [];
            for (var i = 0; i < that._CustomerCategoriesEntityList.Entities.length; i++) {
                if (that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("Parent") == subCategory1ID)
                    subsCategories2IDArray.push(that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("ID"));
            }
            return subsCategories2IDArray;
        },

        _GetCategoryEntity: function (categoryId) {
            var that = this;

            var foundCategoryEntity = $.grep(that._CustomerCategoriesEntityList.Entities, function (o) {
                return o.GetFieldValue("ID") === categoryId
            });

            return foundCategoryEntity[0];
        },


        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.CustomerCategorySelectControl";
    FormClass.BaseType = afw.BasePanel;


    cmn.CustomerCategorySelectControl = FormClass;
})();