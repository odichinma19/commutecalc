from app.services.my_version import compare_option

def test_pass_cheaper_than_tickets():
    result = compare_option("train", 80, 240, 330, 4, monthly_pass_price=300)
    assert result.uses_pass and result.monthly_cost == 300

def test_carpool_splits_cost():
    result = compare_option("carpool", 100, 230, 330, 4, riders=4)  
    assert result.monthly_cost == 433.33
    
def test_bus_without_pass():
    result = compare_option("bus", 40, 270, 330, 2)
    assert result.monthly_cost == round(40 * 2 * (52 / 12), 2)
    assert not result.uses_pass