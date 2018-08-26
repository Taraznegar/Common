(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return cmn.CustomersCategoriesDefControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            if (designObjectData != null)
                afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._CustomerCategoriesEntityList = that._GetCustomerCategoriesEntityList();

            that._NewButton = that.FindControl("NewButton");
            that._EditButton = that.FindControl("EditButton");
            that._DeleteButton = that.FindControl("DeleteButton");
            that._ReloadButton = that.FindControl("ReloadButton");
            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._CustomerCategoryPanel = that.FindControl("CustomerCategoryPanel");

            
            that._NewButton.bind("Click", function (e) { that._NewButton_Click(e); });
            that._EditButton.bind("Click", function (e) { that._EditButton_Click(e); });
            that._DeleteButton.bind("Click", function (e) { that._DeleteButton_Click(e); });
            that._ReloadButton.bind("Click", function (e) { that._ReloadButton_Click(e); });

            that._CreateCustomerCategoryNodes();
        },

        _GetCustomerCategoriesEntityList: function(){
            var that = this;

            var categoriesCount = afw.uiApi.GetEntityCount("cmn.CustomerCategory");
            if (that._CustomerCategoriesEntityList == null || categoriesCount != that._CustomerCategoriesEntityList.Entities.length)
                return that._CustomerCategoriesEntityList = afw.uiApi.FetchEntityList("cmn.CustomerCategory", null, "LevelNumber");
            else
                return that._CustomerCategoriesEntityList;
        },

        _NewButton_Click: function (e) {
            var that = this;

            var selectedNodeDataItem = that._CustomerCategoryTreeView.GetSelectedNodeDataItem();
            if (selectedNodeDataItem == null) {
                afw.MessageDialog.Show("ابتدا یک گزینه را انتخاب نمایید.");
            }
            else {
                var CustomerCategoryEntity = afw.uiApi.CreateNewEntity("cmn.CustomerCategory");
                if (selectedNodeDataItem.id == 1)
                {
                    CustomerCategoryEntity.SetFieldValue("LevelNumber", 1);
                    that._CreateCustomerCategoryEditForm(CustomerCategoryEntity, "New");
                }
                else{
                    var subCategories1 = $.grep(that._GetCustomerCategoriesEntityList().Entities, function (o) {
                        return o.GetFieldValue("ID") === selectedNodeDataItem.id
                    });

                    if (subCategories1[0].GetFieldValue("LevelNumber") == 1) {
                        CustomerCategoryEntity.SetFieldValue("LevelNumber", 2);
                        CustomerCategoryEntity.SetFieldValue("Parent", selectedNodeDataItem.id);
                        that._CreateCustomerCategoryEditForm(CustomerCategoryEntity, "New");
                    }
                    else if (subCategories1[0].GetFieldValue("LevelNumber") == 2) {
                        CustomerCategoryEntity.SetFieldValue("LevelNumber", 3);
                        CustomerCategoryEntity.SetFieldValue("Parent", selectedNodeDataItem.id);
                        that._CreateCustomerCategoryEditForm(CustomerCategoryEntity, "New");
                        //that._CreateCustomerCategoryNodes();
                    }
                    else 
                        return;
                }
            }
        },

        _EditButton_Click: function(e){
            var that = this;
            
            var selectedNodeDataItem = that._CustomerCategoryTreeView.GetSelectedNodeDataItem().id;
            if (selectedNodeDataItem == null || selectedNodeDataItem.id == 1) {
                afw.MessageDialog.Show("ابتدا یک گزینه را انتخاب نمایید.");
            }
            else {
                var categoryEntity = that._GetSelectedNodeEntity(selectedNodeDataItem);
                that._CreateCustomerCategoryEditForm(categoryEntity, "Edit");
                //that._CreateCustomerCategoryNodes();
            }

        },

        _DeleteButton_Click: function(e){
            var that = this;

            try{
                var selectedNodeDataItem = that._CustomerCategoryTreeView.GetSelectedNodeDataItem().id;
                if (selectedNodeDataItem == null || selectedNodeDataItem.id == 1) {
                    afw.MessageDialog.Show("ابتدا یک گزینه را انتخاب نمایید.");
                }
                else {
                    var categoryEntity = that._GetSelectedNodeEntity(selectedNodeDataItem);
                    categoryEntity.ChangeStatus = "Delete";
                    afw.uiApi.ApplyEntityChanges(categoryEntity);
                    that._CreateCustomerCategoryNodes();
                }
            }
            catch (ex) {
                afw.App.HandleError(ex);
                afw.MessageDialog.Show("به دلیل وجود رکورد مرتبط حذف رکورد امکان پذیر نیست");
            }
        },

        _ReloadButton_Click: function(e){
            var that = this;

            that._CreateCustomerCategoryNodes();
        },

        _GetSelectedNodeEntity: function(selectedNodeId){
            var that = this;

            var foundSelectedEntity = $.grep(that._GetCustomerCategoriesEntityList().Entities, function (o) {
                return o.GetFieldValue("ID") === selectedNodeId
            });

            return foundSelectedEntity[0];
        },

        _CreateCustomerCategoryEditForm: function (CustomerCategoryEntity, formMode) {
            var that = this;

            var CustomerCategoryEditForm = afw.uiApi.OpenSavedFormWindow("cmn.CustomerCategoryEditForm", {
                Name: "CustomerCategoryEditForm",
                FormMode: formMode,
                Modal: true,
                Entity: CustomerCategoryEntity
            });

            CustomerCategoryEditForm.bind("Opened",
                             function (e) {
                                 e.Sender.Center();
                             });

            CustomerCategoryEditForm.bind("Close",
                             function (e) {
                                 that._CustomerCategoryEditForm_Close(e);
                             });
        },

        _CustomerCategoryEditForm_Close: function (e) {
            var that = this;
            if (e.Sender._DialogResult == "Ok") {
                that._CreateCustomerCategoryNodes();
            }
            if (e.Sender._DialogResult == "Cancel") {
                return;
            }

        },

        _CreateCustomerCategoryNodes: function(){
            var that = this;

            var treeView = that._CustomerCategoryPanel.FindControl("FolderTreeView");
            if (treeView != null)
                treeView.Destroy();

            that._CustomerCategoryTreeView = new afw.TreeView({
                ParentControl: that._CustomerCategoryPanel,
                Name: "FolderTreeView",
                FillParent: true,
                BackColor: "#FFFFFF"
            });

            var lastRootNodeItem = that._CustomerCategoryTreeView.FindNodeDataItemById(1);
            if (lastRootNodeItem != null)
                lastRootNodeItem.Destroy();

            that._CustomerCategoryTreeView.AppendNode({ id: 1, text: "..." });
            var rootNodeItem = that._CustomerCategoryTreeView.FindNodeDataItemById(1).id;

            that._CustomerCategoriesEntityList = that._GetCustomerCategoriesEntityList();
            // that._AccountEntityList = afw.uiApi.CallServerMethodSync("acc.GetAccountsWithParents", [that._FinancialYearID,""]);

            //for (var index = 0; index < that._CustomerCategoriesEntityList.Entities.length; index++) {
                var mainCategories = $.grep(that._CustomerCategoriesEntityList.ToDataSourceData(), function (o) { return ValueIsIn(o.get("ID"), that._GetMainCategories()); });
                for (var ix = 0; ix < mainCategories.length; ix++) {
                    var cotegoriCustomerID = mainCategories[ix].ID;
                    var CustomerCategoryName = mainCategories[ix].Name;
                    that._CustomerCategoryTreeView.AppendNode({ id: cotegoriCustomerID, text: CustomerCategoryName }, rootNodeItem);

                

               // if (that._CustomerCategoriesEntityList.Entities[index].GetFieldValue("LevelNumber") == 1) {
                    //var cotegoriCustomerID = that._CustomerCategoriesEntityList.Entities[index].GetFieldValue("ID");
                    //var CustomerCategoryName = that._CustomerCategoriesEntityList.Entities[index].GetFieldValue("Name");

                    //that._CustomerCategoryTreeView.AppendNode({ id: cotegoriCustomerID, text: CustomerCategoryName }, rootNodeItem);

                    var subCategories1 = $.grep(that._CustomerCategoriesEntityList.ToDataSourceData(), function (o) { return ValueIsIn(o.get("ID"), that._GetSubsCategories1(cotegoriCustomerID)); });

                    for (var i = 0; i < subCategories1.length; i++) {
                        var subCtaegory1ID = subCategories1[i].ID;
                        var subCtaegory1Name = subCategories1[i].Name;

                        that._CustomerCategoryTreeView.AppendNode({ id: subCtaegory1ID, text: subCtaegory1Name }, cotegoriCustomerID);

                        //var sub1NodeItem = that._CustomerCategoryTreeView.FindNodeDataItemById(subCtaegory1ID);

                        var subCategories2 = $.grep(that._CustomerCategoriesEntityList.ToDataSourceData(), function (o) { return ValueIsIn(o.get("ID"), that._GetSubsCategories2(subCtaegory1ID)); });

                        for (var j = 0; j < subCategories2.length; j++) {
                            var subCtaegory2ID = subCategories2[j].ID;
                            var subCtaegory2Name = subCategories2[j].Name;

                            that._CustomerCategoryTreeView.AppendNode({ id: subCtaegory2ID, text: subCtaegory2Name }, subCtaegory1ID);
                        }
                    }
                }
           // }
            that._CustomerCategoryTreeView.bind("SelectedNodeChanged", function (e) { that._CustomerCategoryTreeView_SelectedNodeChanged(e); });
        },

        _CustomerCategoryTreeView_SelectedNodeChanged: function (e) {
            var that = this;

            
        },

        _GetMainCategories: function () {
            var that = this;

            //that._CustomerCategoriesEntityList = that._GetCustomerCategoriesEntityList();

            var mainCategoriesIDArray = [];
            for (var i = 0; i < that._CustomerCategoriesEntityList.Entities.length; i++) {
                if (that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("LevelNumber") == 1)
                    mainCategoriesIDArray.push(that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("ID"));
            }
            return mainCategoriesIDArray;
        },

        _GetSubsCategories1: function (cotegoryCustomerID) {
            var that = this;

            that._CustomerCategoriesEntityList = that._GetCustomerCategoriesEntityList();

            var subsCategories1IDArray = [];
            for (var i = 0; i < that._CustomerCategoriesEntityList.Entities.length; i++) {
                if (that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("Parent") == cotegoryCustomerID)
                    subsCategories1IDArray.push(that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("ID"));
            }
            return subsCategories1IDArray; 
        },

        _GetSubsCategories2: function (subCtaegory1ID) {
            var that = this;

            var subsCategories2IDArray = [];
            for (var i = 0; i < that._CustomerCategoriesEntityList.Entities.length; i++) {
                if (that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("Parent") == subCtaegory1ID)
                    subsCategories2IDArray.push(that._CustomerCategoriesEntityList.Entities[i].GetFieldValue("ID"));
            }
            return subsCategories2IDArray;
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.CustomersCategoriesDefControl";
    FormClass.BaseType = afw.BasePanel;


    cmn.CustomersCategoriesDefControl = FormClass;
})();