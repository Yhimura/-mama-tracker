from datetime import date, timedelta
from typing import Dict, Any, Optional
from pydantic import BaseModel


class FetalInfo(BaseModel):
    week: int
    fruit_name: str
    fruit_emoji: str
    weight_grams: Optional[int] = None
    length_cm: Optional[float] = None
    description: str


# Comprehensive weekly fetal size comparison table (weeks 3 through 42)
FETAL_WEEK_DATA: Dict[int, Dict[str, Any]] = {
    3: {"name": "Ванильное зернышко", "emoji": "🌱", "weight": 0, "length": 0.1, "desc": "Оплодотворенная яйцеклетка имплантируется в стенку матки."},
    4: {"name": "Маковое зернышко", "emoji": "🌾", "weight": 0, "length": 0.2, "desc": "Формируются околоплодный пузырь и желточный мешок."},
    5: {"name": "Кунжутное семечко", "emoji": "🌰", "weight": 1, "length": 0.4, "desc": "Начинает биться крошечное сердце."},
    6: {"name": "Чечевичное зернышко", "emoji": "🫘", "weight": 1, "length": 0.6, "desc": "Формируются зачатки ручек, ножек и черты лица."},
    7: {"name": "Черничка", "emoji": "🫐", "weight": 1, "length": 1.3, "desc": "Малыш начинает двигаться, активно растет головной мозг."},
    8: {"name": "Малинка", "emoji": "🍓", "weight": 2, "length": 1.6, "desc": "Формируются крошечные пальчики и веки."},
    9: {"name": "Виноградинка", "emoji": "🍇", "weight": 3, "length": 2.3, "desc": "Сердце разделено на четыре камеры, исчезает хвостик."},
    10: {"name": "Оливка", "emoji": "🫒", "weight": 5, "length": 3.1, "desc": "Завершается эмбриональный период, теперь это официально плод!"},
    11: {"name": "Инжир", "emoji": "🌰", "weight": 8, "length": 4.1, "desc": "Малыш уже может сжимать кулачки и зевать."},
    12: {"name": "Лайм", "emoji": "🍋", "weight": 15, "length": 5.4, "desc": "Конец I триместра. Сформированы все основные органы."},
    13: {"name": "Лимон", "emoji": "🍋", "weight": 25, "length": 7.4, "desc": "Начинают образовываться уникальные отпечатки пальчиков."},
    14: {"name": "Персик", "emoji": "🍑", "weight": 45, "length": 8.7, "desc": "Начало II триместра — золотого времени беременности."},
    15: {"name": "Яблоко", "emoji": "🍎", "weight": 70, "length": 10.1, "desc": "Малыш начинает различать яркий свет через веки."},
    16: {"name": "Авокадо", "emoji": "🥑", "weight": 100, "length": 11.6, "desc": "Сердечко перекачивает до 25 литров крови в сутки."},
    17: {"name": "Гранат", "emoji": "🍎", "weight": 140, "length": 13.0, "desc": "Малыш тренирует сосательный и глотательный рефлексы."},
    18: {"name": "Болгарский перец", "emoji": "🫑", "weight": 190, "length": 14.2, "desc": "Малыш может слышать биение вашего сердца и звуки извне."},
    19: {"name": "Манго", "emoji": "🥭", "weight": 240, "length": 15.3, "desc": "Тело малыша покрыто защитной первородной смазкой."},
    20: {"name": "Банан", "emoji": "🍌", "weight": 300, "length": 25.6, "desc": "Экватор беременности! Многие мамы ощущают первые шевеления."},
    21: {"name": "Морковь", "emoji": "🥕", "weight": 360, "length": 26.7, "desc": "Малыш заглатывает амниотическую жидкость и различает вкусы."},
    22: {"name": "Папайя", "emoji": "🍈", "weight": 430, "length": 27.8, "desc": "Появляются брови и реснички, активно развивается осязание."},
    23: {"name": "Баклажан", "emoji": "🍆", "weight": 500, "length": 28.9, "desc": "Малыш весит полкилограмма и может икать."},
    24: {"name": "Кукурузный початок", "emoji": "🌽", "weight": 600, "length": 30.0, "desc": "Начинает вырабатываться сурфактант для дыхания легких."},
    25: {"name": "Цветная капуста", "emoji": "🥦", "weight": 660, "length": 34.6, "desc": "Кожа становится менее прозрачной, накапливается жирок."},
    26: {"name": "Кабачок", "emoji": "🥒", "weight": 760, "length": 35.6, "desc": "Малыш открывает глазки и реагирует на прикосновения к животу."},
    27: {"name": "Брокколи", "emoji": "🥦", "weight": 875, "length": 36.6, "desc": "Конец II триместра. Малыш четко различает день и ночь."},
    28: {"name": "Крупный кокос", "emoji": "🥥", "weight": 1000, "length": 37.6, "desc": "Начало III триместра. Вес перешагнул рубеж в 1 кг!"},
    29: {"name": "Мускатная тыква", "emoji": "🎃", "weight": 1150, "length": 38.6, "desc": "Мышцы и легкие продолжают активно созревать."},
    30: {"name": "Белокочанная капуста", "emoji": "🥬", "weight": 1300, "length": 39.9, "desc": "Кроха активно крутит головой и потягивается."},
    31: {"name": "Ананас", "emoji": "🍍", "weight": 1500, "length": 41.1, "desc": "Малыш быстро набирает вес, кости становятся крепче."},
    32: {"name": "Дыня канталупа", "emoji": "🍈", "weight": 1700, "length": 42.4, "desc": "Большинство малышей уже переворачиваются головкой вниз."},
    33: {"name": "Ананас крупный", "emoji": "🍍", "weight": 1900, "length": 43.7, "desc": "Иммунная система малыша получает материнские антитела."},
    34: {"name": "Мускусная дыня", "emoji": "🍈", "weight": 2100, "length": 45.0, "desc": "Нервная система и зрение почти полностью развиты."},
    35: {"name": "Медовая дыня", "emoji": "🍈", "weight": 2400, "length": 46.2, "desc": "В матке становится тесно, толчки становятся более плавными."},
    36: {"name": "Салат ромэн", "emoji": "🥬", "weight": 2600, "length": 47.4, "desc": "Каждый день малыш прибавляет около 25–30 граммов."},
    37: {"name": "Зимняя дыня", "emoji": "🍈", "weight": 2850, "length": 48.6, "desc": "Беременность считается доношенной с полных 37 недель!"},
    38: {"name": "Стебель сельдерея", "emoji": "🥬", "weight": 3100, "length": 49.8, "desc": "Органы полностью сформированы и готовы к первому вдоху."},
    39: {"name": "Мини-арбуз", "emoji": "🍉", "weight": 3300, "length": 50.7, "desc": "Малыш запасает железо и гликоген для первых дней жизни."},
    40: {"name": "Спелый арбуз", "emoji": "🍉", "weight": 3500, "length": 51.2, "desc": "Предполагаемая дата родов! Встреча с крохой совсем близко."},
    41: {"name": "Сладкая тыква", "emoji": "🎃", "weight": 3650, "length": 51.8, "desc": "Малыш уютно ждет подходящего момента для появления на свет."},
    42: {"name": "Большая тыква", "emoji": "🎃", "weight": 3750, "length": 52.0, "desc": "Малыш под постоянным чутким контролем врачей."},
}


def calculate_gestational_age(
    start_date: Optional[date] = None,
    estimated_due_date: Optional[date] = None,
    conception_date: Optional[date] = None,
    target_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Calculates gestational age based on medical standards:
    - Rule of Naegele: EDD = LMP (start_date) + 280 days
    - If conception_date given: LMP ≈ conception_date - 14 days
    - Gestational age = target_date - LMP
    """
    today = target_date or date.today()

    # Determine LMP (start_date)
    lmp: Optional[date] = start_date
    edd: Optional[date] = estimated_due_date

    if lmp is None and edd is not None:
        lmp = edd - timedelta(days=280)
    elif lmp is not None and edd is None:
        edd = lmp + timedelta(days=280)
    elif lmp is None and conception_date is not None:
        lmp = conception_date - timedelta(days=14)
        edd = lmp + timedelta(days=280)

    if lmp is None:
        raise ValueError("Either start_date (LMP) or estimated_due_date (EDD) must be provided.")

    days_pregnant = max(0, (today - lmp).days)
    weeks = days_pregnant // 7
    days = days_pregnant % 7

    # Calculate trimester
    if weeks < 14:
        trimester = 1
        trimester_title = "I триместр"
    elif weeks < 28:
        trimester = 2
        trimester_title = "II триместр"
    else:
        trimester = 3
        trimester_title = "III триместр"

    # Days remaining until due date
    days_left = (edd - today).days if edd else max(0, 280 - days_pregnant)

    # Get fetal size comparison
    effective_week = max(3, min(42, weeks if weeks >= 3 else 3))
    fetal_data = FETAL_WEEK_DATA.get(effective_week, FETAL_WEEK_DATA[12])

    fetal_info = FetalInfo(
        week=weeks if weeks > 0 else 1,
        fruit_name=fetal_data["name"],
        fruit_emoji=fetal_data["emoji"],
        weight_grams=fetal_data.get("weight"),
        length_cm=fetal_data.get("length"),
        description=fetal_data["desc"],
    )

    return {
        "start_date": lmp,
        "estimated_due_date": edd,
        "current_week": weeks,
        "current_day": days,
        "days_pregnant_total": days_pregnant,
        "days_left": days_left,
        "trimester": trimester,
        "trimester_title": trimester_title,
        "fetal_info": fetal_info.model_dump(),
    }
