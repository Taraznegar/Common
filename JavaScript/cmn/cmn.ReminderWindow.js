(function () {
    var FormClass = afw.Window.extend({
        GetType: function () {
            return cmn.ReminderWindow;
        },

        init: function (options) {
            var that = this;

            if (cmn.ReminderWindow.Instance != null)
                throw "ReminderWindow is already created."

            afw.Window.fn.init.call(that, options);
            var formObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, formObjectData, false);

            that.SetTitle("یادآوری");

            cmn.ReminderWindow.Instance = that;
            cmn.ReminderWindow.IsOpening = false;
            cmn.ReminderWindow.IsOpen = false;

            that._ItemsDockPanel = that.FindControl("ItemsDockPanel");
            that.FindControl("SnoozeButton").bind("Click", function (e) { that._SnoozeButton_Click(e); });

            that._AdjustSize();
        },

        Open: function () {
            var that = this;

            if (cmn.ReminderWindow.IsOpening == true)
                return;

            afw.Window.fn.Open.call(that);
        },

        SetItems: function (itemInfoEntities) {
            var that = this;

            //remove items that itemInfo is not in list:
            var removingItemId = null;
            var currentItemControl = null;
            var itemInfoExistsInNewList = false;
            while (true) {
                removingItemId = null;
                currentItemControl = null;
                for (var i = 0; i < that._ItemsDockPanel.GetPanesCount() - 1; i++) {
                    currentItemControl = that._ItemsDockPanel.Panes[i].ChildControls[0];                   
                    
                    itemInfoExistsInNewList = $.grep(itemInfoEntities,
                        function (o) { 
                            return o.GetFieldValue("ID") == currentItemControl.GetItemInfoEntity().GetFieldValue("ID") 
                        }).length > 0;

                    if (!itemInfoExistsInNewList)
                        removingItemId = currentItemControl.GetItemInfoEntity().GetFieldValue("ID");
                }

                if (removingItemId != null)
                    that.RemoveItem(removingItemId);
                else
                    break;
            }

            //add new items:
            for (var i = 0; i < itemInfoEntities.length; i++) {
                if (!that.ItemExists(itemInfoEntities[i].GetFieldValue("ID"))) {
                    that.AddItem(itemInfoEntities[i]);
                }
            }
        },

        GetItemsCount: function () {
            var that = this;

            return that._ItemsDockPanel.GetPanesCount() - 1;
        },

        GetItemIndex: function (itemId) {
            var that = this;

            for (var i = 0; i < that._ItemsDockPanel.GetPanesCount() - 1; i++) {
                if (that._ItemsDockPanel.Panes[i].ChildControls[0].GetItemInfoEntity().GetFieldValue("ID") == itemId)
                    return i;
            }

            throw String.Format("Item with id '{0}' not exists.", itemId);
        },

        TryGetItemControl: function (itemId) {
            var that = this;

            for (var i = 0; i < that._ItemsDockPanel.GetPanesCount() - 1; i++) {
                if (that._ItemsDockPanel.Panes[i].ChildControls[0].GetItemInfoEntity().GetFieldValue("ID") == itemId)
                    return that._ItemsDockPanel.Panes[i].ChildControls[0];
            }

            return null;
        },

        ItemExists: function (itemId) {
            var that = this;

            return that.TryGetItemControl(itemId) != null;
        },

        AddItem: function (itemInfoEntity) {
            var that = this;

            var itemId = itemInfoEntity.GetFieldValue("ID");

            if (that.ItemExists(itemId))
                throw String.Format("Item with id '{0}' already exists", itemId);

            var itemIndex = that._ItemsDockPanel.GetPanesCount() - 1;
            var itemPane = that._ItemsDockPanel.InsertPane(itemIndex, { Size: 50 }, true);

            var itemControl = new cmn.ReminderItemControl({
                ParentControl: itemPane,
                Name: "ReminderItemControl_" + itemId,
                ItemInfoEntity: itemInfoEntity
            });
        },

        RemoveItem: function (itemId) {
            var that = this;

            var itemIndex = that.GetItemIndex(itemId);
            that._ItemsDockPanel.RemovePane(itemIndex);
        },

        _RemoveAllItems: function () {
            var that = this;

            while (that.GetItemsCount() != 0) {
                that._ItemsDockPanel.RemovePane(0);
            }
        },

        _OnOpening: function (sender, e) {
            var that = this;

            cmn.ReminderWindow.IsOpening = true;

            afw.Window.fn._OnOpening.call(that);

            that._AdjustSize();           
            that.Center();
        },

        _OnOpened: function (sender, e) {
            var that = this;

            cmn.ReminderWindow.IsOpening = false;
            cmn.ReminderWindow.IsOpen = true;

            afw.Window.fn._OnOpened.call(that);

            that._AdjustSize();
            that.Center();
        },

        _OnClosing: function () {
            var that = this;

            afw.Window.fn._OnClosing.call(that);

            if (that.GetItemsCount() != 0)
                that._SnoozeItems(false);
        },

        _OnClosed: function () {
            var that = this;

            cmn.ReminderWindow.Instance = null;
            cmn.ReminderWindow.IsOpen = false;

            afw.Window.fn._OnClosed.call(that);
        },

        _AdjustSize: function () {
            var that = this;

            if (cmn.ReminderWindow.StoredWidth != null)
                that.SetSize(cmn.ReminderWindow.StoredWidth, cmn.ReminderWindow.StoredHeight);
            else
                that.SetSize(400, 500);
        },

        _SnoozeButton_Click: function (e) {
            var that = this;

            that._SnoozeItems(true);
        },

        _SnoozeItems: function (closeWindow) {
            var that = this;

            var reminderItemsEntityList = afw.uiApi.CreateEntityList();

            for (var i = 0; i < that._ItemsDockPanel.GetPanesCount() - 1; i++) {
                reminderItemsEntityList.Entities.push(that._ItemsDockPanel.Panes[i].ChildControls[0].GetItemInfoEntity());
            }

            if (!that.IsDestroying)
                afw.uiApi.ShowProgress(that);

            afw.uiApi.CallServerMethodAsync("cmn.SnoozeReminderItems", [reminderItemsEntityList], function (result) {
                if (!that.IsDestroying)
                    afw.uiApi.HideProgress(that);

                if (result.HasError) {
                    afw.ErrorDialog.Show(result.ErrorMessage);
                }
                else {
                    if (!that.IsDestroying) {
                        that._RemoveAllItems();

                        if (closeWindow)
                            that.Close();
                    }
                }
            });
        }
    });

    //Static Members:

    FormClass.TypeName = "cmn.ReminderWindow";
    FormClass.BaseType = afw.Window;

    FormClass.Instance = null;
    FormClass.IsOpening = false;
    FormClass.IsOpen = false;
    FormClass.StoredWidth = null;
    FormClass.StoredHeight = null;

    FormClass.Open = function () {
        if (cmn.ReminderWindow.Instance == null) {
            new cmn.ReminderWindow({ Name: "ReminderWindow", Modal: true });
        }

        if (cmn.ReminderWindow.IsOpen == false) {
            cmn.ReminderWindow.Instance.Open();
        }
    }

    FormClass.Close = function () {
        if (cmn.ReminderWindow.Instance == null) {
            throw "ReminderWindow is not created.";
        }

        if (cmn.ReminderWindow.IsOpen) {
            cmn.ReminderWindow.Instance.Close();
        }
    }

    FormClass.SetItems = function (itemInfoEntities) {
        if (cmn.ReminderWindow.Instance == null) {
            throw "ReminderWindow is not created.";
        }

        cmn.ReminderWindow.Instance.SetItems(itemInfoEntities);
    }


    cmn.ReminderWindow = FormClass;
})();