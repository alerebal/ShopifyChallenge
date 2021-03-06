shipCtrl = {};
const Shipment = require('../models/Shipment');
const { getItemQty, adjustInventory } = require('../helpers/helpers');

// Create a shipment function take a customer_id and a list of items, with the item id and the quantity, and return an order with the customer_id and a list of items id and the quantity of each items to be deliver if there are quantity of all of them.
shipCtrl.createShipment = async (req, res) => {
    try {
        const { customer_id, itemsList } = req.body;
        const items_to_shipment = [];
        const items_no_availables = [];
        for (let item of itemsList) {
            const qty = await getItemQty(item.item_id)
            // Check if there are enough quantity of the items,
            // if there are
            if (qty > 0) {
                // If the quantity of the order is less or equal than the stock quantity
                if (item.qty <= qty) {
                    items_to_shipment.push({item: item.item_id, qty: item.qty})
                    adjustInventory(item.item_id, (item.qty * -1))
                } else {
                    // if there are not enough items, add the item_id and a message with the quantity no available to items_no_available array.
                    const qty_not_available = item.qty - qty;
                    items_to_shipment.push({item: item.item_id, qty})
                    items_no_availables.push({item: item.item_id, msg: `Quantity no available: ${qty_not_available}`})
                    adjustInventory(item.item_id, (qty * -1))
                }
            // if there are not, add the item_id and a message to items_no_available array.
            } else {
                items_no_availables.push({item: item.item_id, msg: 'Item no available'})
            }
        }
        const shipment = new Shipment({customer_id, itemsList: items_to_shipment, itemsListNoAvailables: items_no_availables})
        await shipment.save()
        return res.status(200).json({shipment})
    } catch (error) {
        return res.status(400).json({Error: error.name, Error_msg: error.message});
    }
}

module.exports = shipCtrl;