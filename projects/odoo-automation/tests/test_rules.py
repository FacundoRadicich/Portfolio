import unittest
from datetime import date, timedelta

from odoo_automation.analytics import Weights, purchase_status, score_leads, strength_index
from odoo_automation.orders import Customer, OrderLine, build_order_lines, normalize_vat
from odoo_automation.production import monthly_forecast, rank, simulate

PRODUCTS = {
    "Chalk Paint Ivory 210cc": {"id": 1, "list_price": 3500.0},
    "Water Varnish 500cc": {"id": 2, "list_price": 8000.0},
}


class OrderRulesTest(unittest.TestCase):
    def test_line_discount_applied_for_list_price_customer(self):
        customer = Customer(1, "Art Store", None, "IVA Responsable Inscripto")
        plan = build_order_lines(customer, [OrderLine("Chalk Paint Ivory 210cc", 6)], PRODUCTS, line_discount=22)
        self.assertEqual(plan.lines[0], {"product_id": 1, "product_uom_qty": 6, "price_unit": 3500.0, "discount": 22.0})

    def test_own_pricelist_never_gets_a_second_discount(self):
        customer = Customer(1, "Art Store", "Descuento 22% (ARS)", "IVA Responsable Inscripto")
        plan = build_order_lines(customer, [OrderLine("Chalk Paint Ivory 210cc", 6)], PRODUCTS, line_discount=22)
        self.assertNotIn("discount", plan.lines[0])
        self.assertNotIn("price_unit", plan.lines[0])

    def test_non_vat_registered_customer_gets_taxes_cleared(self):
        customer = Customer(1, "Workshop", None, "Responsable Monotributo")
        plan = build_order_lines(customer, [OrderLine("Water Varnish 500cc", 2)], PRODUCTS)
        self.assertEqual(plan.lines[0]["tax_ids"], [(6, 0, [])])

    def test_missing_products_and_price_drift_are_reported(self):
        customer = Customer(1, "Art Store", None, "IVA Responsable Inscripto")
        plan = build_order_lines(customer, [
            OrderLine("Dark Blue 120cc", 3),
            OrderLine("Water Varnish 500cc", 1, catalog_price=7500.0),
        ], PRODUCTS)
        self.assertEqual(plan.missing_products, ["Dark Blue 120cc"])
        self.assertEqual(plan.price_drift, [("Water Varnish 500cc", 7500.0, 8000.0)])
        self.assertEqual(len(plan.lines), 1)

    def test_normalize_vat(self):
        self.assertEqual(normalize_vat("20-12345678-9"), "20123456789")


class ProductionTest(unittest.TestCase):
    def test_simulation_finds_first_shortage_and_quantity(self):
        need = simulate("Ivory 210cc", on_hand=100, demand=monthly_forecast(420, 7, horizon=4))
        self.assertEqual(need.first_shortage_month, 1)
        self.assertEqual(need.total_to_produce, 140)
        self.assertEqual(need.urgency, "soon")

    def test_negative_stock_is_critical_and_ranked_first(self):
        needs = [simulate("A", 500, [10] * 6), simulate("B", -4, [10] * 6), simulate("C", 25, [10] * 6)]
        self.assertEqual([n.product for n in rank(needs)], ["B", "C", "A"])


class AnalyticsTest(unittest.TestCase):
    def test_purchase_status(self):
        today = date(2026, 9, 18)
        every_30 = [today - timedelta(days=d) for d in (100, 70, 40)]
        self.assertEqual(purchase_status(every_30, today), ("window", 30, 40))
        self.assertEqual(purchase_status([today - timedelta(days=d) for d in (130, 100, 70)], today)[0], "overdue")
        self.assertEqual(purchase_status([today - timedelta(days=10), today - timedelta(days=40)], today)[0], "on_track")
        self.assertEqual(purchase_status([today], today)[0], "single")

    def test_lead_scoring_prefers_profiles_that_resemble_buyers(self):
        buyers = [{"category": "Art supply", "region": "Buenos Aires"}] * 3 + [{"category": "Paint store", "region": "Salta"}]
        leads = [
            {"name": "x", "tier": "Standard", "category": "Paint store", "region": "Salta"},
            {"name": "y", "tier": "Standard", "category": "Art supply", "region": "Buenos Aires"},
        ]
        ranked = score_leads(leads, buyers)
        self.assertEqual(ranked[0]["name"], "y")
        self.assertEqual(ranked[0]["score"], 76)
        self.assertNotIn("score", leads[0])  # inputs untouched

    def test_strength_index_and_weights(self):
        self.assertEqual(strength_index(["a", "a", "b"]), {"a": 100, "b": 50})
        self.assertAlmostEqual(Weights(2, 1, 1).normalized().tier, 0.5)
        with self.assertRaises(ValueError):
            Weights(0, 0, 0).normalized()


if __name__ == "__main__":
    unittest.main()
