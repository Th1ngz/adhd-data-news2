from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
INPUT_PATH = ROOT / "预处理" / "小红书145条ADHD笔记_已完成编码.xlsx"
OUTPUT_DIR = ROOT / "data"


AUTHOR_TYPE_MAP = {
    1: "医生/医院/专业机构",
    2: "心理咨询/心理科普账号",
    3: "患者/确诊者本人",
    4: "疑似患者/自述困扰者",
    5: "普通泛生活博主",
    6: "商业/营销导向账号",
    9: "无法判断",
}

NARRATIVE_MAP = {
    1: "第一人称亲历",
    2: "面向读者的科普/建议",
    3: "混合型",
    9: "无法判断",
}

CONTENT_TYPE_MAP = {
    1: "症状共鸣/自我识别类",
    2: "科普纠偏类",
    3: "确诊/就医流程类",
    4: "药物/治疗体验类",
    5: "患者生活经验/困境叙事类",
    6: "共病/鉴别诊断类",
    7: "身份认同/人格化/天赋化表达类",
    9: "无法判断",
}

ENGAGEMENT_TYPE_ORDER = [
    "症状共鸣/自我识别类",
    "药物/治疗体验类",
    "科普纠偏类",
    "身份认同/人格化/天赋化表达类",
    "患者生活经验/困境叙事类",
    "共病/鉴别诊断类",
    "确诊/就医流程类",
]

EXPECTED_CONTENT_COUNTS = {
    "患者生活经验/困境叙事类": 34,
    "症状共鸣/自我识别类": 32,
    "科普纠偏类": 29,
    "身份认同/人格化/天赋化表达类": 16,
    "确诊/就医流程类": 13,
    "共病/鉴别诊断类": 11,
    "药物/治疗体验类": 7,
    "无法判断": 3,
}

EXPECTED_AUTHOR_COUNTS = {
    "疑似患者/自述困扰者": 51,
    "心理咨询/心理科普账号": 31,
    "普通泛生活博主": 27,
    "患者/确诊者本人": 23,
    "医生/医院/专业机构": 5,
    "商业/营销导向账号": 4,
    "无法判断": 4,
}

EXPECTED_ENGAGEMENT_MEDIANS = {
    "症状共鸣/自我识别类": {"likes": 2012.5, "favorites": 675.0, "comments": 274.0},
    "药物/治疗体验类": {"likes": 1695.0, "favorites": 615.0, "comments": 214.0},
    "科普纠偏类": {"likes": 1372.5, "favorites": 626.5, "comments": 169.5},
    "身份认同/人格化/天赋化表达类": {"likes": 1197.0, "favorites": 458.5, "comments": 220.0},
    "患者生活经验/困境叙事类": {"likes": 1019.0, "favorites": 430.5, "comments": 246.0},
    "共病/鉴别诊断类": {"likes": 546.0, "favorites": 427.0, "comments": 59.0},
    "确诊/就医流程类": {"likes": 299.0, "favorites": 158.0, "comments": 71.0},
}

EXPECTED_IMPACT_COUNTS = {
    "情绪管理受影响": 52,
    "学习受影响": 46,
    "生活管理受影响": 41,
    "人际关系受影响": 30,
    "工作受影响": 23,
}

EXPECTED_BINARY_COUNTS = {
    "是否直接引导自我判断": 26,
    "是否存在强共鸣式表达": 64,
    "是否提醒不要互联网诊断": 11,
    "是否建议寻求专业评估/医院就诊": 19,
    "是否提到功能损害": 83,
    "是否提到早发性": 42,
    "是否提到持续性": 27,
    "是否提到跨情境性": 19,
    "是否存在人格化/标签化/天赋化表达": 28,
    "是否将普遍体验直接等同于ADHD": 20,
    "是否存在商业导向": 6,
}

EXPECTED_MATRIX = {
    ("低共鸣", "低边界"): 65,
    ("低共鸣", "高边界"): 16,
    ("高共鸣", "低边界"): 54,
    ("高共鸣", "高边界"): 10,
}

IMPACT_FIELDS = [
    "学习受影响",
    "工作受影响",
    "人际关系受影响",
    "生活管理受影响",
    "情绪管理受影响",
]

BOUNDARY_FIELDS = [
    "是否提到功能损害",
    "是否提到早发性",
    "是否提到持续性",
    "是否提到跨情境性",
    "是否提醒不要互联网诊断",
    "是否建议寻求专业评估/医院就诊",
]

RISK_FIELDS = [
    "是否直接引导自我判断",
    "是否将普遍体验直接等同于ADHD",
    "是否存在人格化/标签化/天赋化表达",
    "是否存在商业导向",
]


def parse_compact_number(value: Any) -> float | None:
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)

    text = str(value).strip().replace(",", "")
    if not text or text in {"点赞", "收藏", "评论", "nan", "None"}:
        return None

    multiplier = 1.0
    if text.endswith("万+"):
        text = text[:-2]
        multiplier = 10000.0
    elif text.endswith("万"):
        text = text[:-1]
        multiplier = 10000.0
    elif text.endswith("千+"):
        text = text[:-2]
        multiplier = 1000.0
    elif text.endswith("千"):
        text = text[:-1]
        multiplier = 1000.0
    elif text.endswith("+"):
        text = text[:-1]

    try:
        return float(text) * multiplier
    except ValueError:
        return None


def pct(value: int, total: int) -> float:
    return round(value / total * 100, 1)


def to_serializable(value: Any) -> Any:
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if isinstance(value, (int, str, bool)):
        return value
    if isinstance(value, float):
        return None if math.isnan(value) else value
    return str(value)


def ensure_equal(actual: Any, expected: Any, label: str) -> None:
    if actual != expected:
        raise SystemExit(f"{label} mismatch:\nactual={actual}\nexpected={expected}")


def ensure_float_dict(actual: dict[str, dict[str, float]], expected: dict[str, dict[str, float]], label: str) -> None:
    rounded_actual = {
        outer_key: {inner_key: round(value, 1) for inner_key, value in inner.items()}
        for outer_key, inner in actual.items()
    }
    rounded_expected = {
        outer_key: {inner_key: round(value, 1) for inner_key, value in inner.items()}
        for outer_key, inner in expected.items()
    }
    ensure_equal(rounded_actual, rounded_expected, label)


def build_sorted_stats(series: pd.Series, total: int) -> list[dict[str, Any]]:
    counts = series.value_counts().sort_values(ascending=False)
    return [
        {
            "label": label,
            "count": int(count),
            "percent": pct(int(count), total),
        }
        for label, count in counts.items()
    ]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    df = pd.read_excel(INPUT_PATH, sheet_name="编码表")
    total = len(df)

    df["点赞数值"] = df["点赞"].map(parse_compact_number)
    df["收藏数值"] = df["收藏"].map(parse_compact_number)
    df["评论数值"] = df["评论"].map(parse_compact_number)
    df["作者类型标签"] = df["作者类型"].map(lambda value: AUTHOR_TYPE_MAP.get(int(value), "无法判断"))
    df["叙述视角标签"] = df["叙述视角"].map(lambda value: NARRATIVE_MAP.get(int(value), "无法判断"))
    df["内容主类型标签"] = df["内容主类型"].map(lambda value: CONTENT_TYPE_MAP.get(int(value), "无法判断"))

    content_counts = {
        label: int(count)
        for label, count in df["内容主类型标签"].value_counts().sort_values(ascending=False).items()
    }
    author_counts = {
        label: int(count)
        for label, count in df["作者类型标签"].value_counts().sort_values(ascending=False).items()
    }
    ensure_equal(content_counts, EXPECTED_CONTENT_COUNTS, "内容主类型统计")
    ensure_equal(author_counts, EXPECTED_AUTHOR_COUNTS, "作者类型统计")

    engagement = (
        df[df["内容主类型标签"] != "无法判断"]
        .groupby("内容主类型标签")[["点赞数值", "收藏数值", "评论数值"]]
        .median()
        .round(1)
    )
    engagement_medians = {
        label: {
            "likes": float(engagement.loc[label, "点赞数值"]),
            "favorites": float(engagement.loc[label, "收藏数值"]),
            "comments": float(engagement.loc[label, "评论数值"]),
        }
        for label in ENGAGEMENT_TYPE_ORDER
    }
    ensure_float_dict(engagement_medians, EXPECTED_ENGAGEMENT_MEDIANS, "互动中位数")

    impact_counts = {field: int(df[field].sum()) for field in IMPACT_FIELDS}
    ensure_equal(
        dict(sorted(impact_counts.items(), key=lambda item: item[1], reverse=True)),
        EXPECTED_IMPACT_COUNTS,
        "功能损害场景统计",
    )

    binary_counts = {field: int(df[field].sum()) for field in EXPECTED_BINARY_COUNTS}
    ensure_equal(binary_counts, EXPECTED_BINARY_COUNTS, "边界与风险统计")

    df["边界提醒"] = (
        (df["是否提醒不要互联网诊断"] == 1)
        | (df["是否建议寻求专业评估/医院就诊"] == 1)
    ).astype(int)

    matrix_counts = {
        ("低共鸣" if resonance == 0 else "高共鸣", "低边界" if boundary == 0 else "高边界"): int(count)
        for (resonance, boundary), count in df.groupby(["是否存在强共鸣式表达", "边界提醒"]).size().items()
    }
    ensure_equal(matrix_counts, EXPECTED_MATRIX, "二维矩阵统计")

    summary = {
        "meta": {
            "sampleSize": total,
            "source": "小红书搜索“ADHD”综合排序结果人工编码样本",
            "workbook": INPUT_PATH.name,
            "sheet": "编码表",
        },
        "contentTypeStats": build_sorted_stats(df["内容主类型标签"], total),
        "authorTypeStats": build_sorted_stats(df["作者类型标签"], total),
        "engagementMedianStats": [
            {
                "label": label,
                "likes": engagement_medians[label]["likes"],
                "favorites": engagement_medians[label]["favorites"],
                "comments": engagement_medians[label]["comments"],
            }
            for label in ENGAGEMENT_TYPE_ORDER
        ],
        "impactStats": [
            {
                "label": label,
                "count": impact_counts[label],
                "percent": pct(impact_counts[label], total),
            }
            for label, _ in sorted(impact_counts.items(), key=lambda item: item[1], reverse=True)
        ],
        "boundaryCoverageStats": [
            {
                "label": label,
                "count": binary_counts[label],
                "percent": pct(binary_counts[label], total),
            }
            for label, _ in sorted(
                ((label, binary_counts[label]) for label in BOUNDARY_FIELDS),
                key=lambda item: item[1],
                reverse=True,
            )
        ],
        "riskStats": [
            {
                "label": label,
                "count": binary_counts[label],
                "percent": pct(binary_counts[label], total),
            }
            for label in RISK_FIELDS
        ],
        "matrixStats": [
            {
                "resonance": resonance,
                "boundary": boundary,
                "count": EXPECTED_MATRIX[(resonance, boundary)],
                "percent": pct(EXPECTED_MATRIX[(resonance, boundary)], total),
            }
            for resonance, boundary in [
                ("低共鸣", "低边界"),
                ("高共鸣", "低边界"),
                ("低共鸣", "高边界"),
                ("高共鸣", "高边界"),
            ]
        ],
        "validation": {
            "contentCounts": content_counts,
            "authorCounts": author_counts,
            "impactCounts": impact_counts,
            "binaryCounts": binary_counts,
            "matrixCounts": {
                f"{resonance}+{boundary}": count
                for (resonance, boundary), count in matrix_counts.items()
            },
        },
    }

    records = [
        {column: to_serializable(value) for column, value in row.items()}
        for row in df.to_dict(orient="records")
    ]

    (OUTPUT_DIR / "xhs_adhd_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (OUTPUT_DIR / "xhs_adhd_data.js").write_text(
        "window.XHS_ADHD_DATA = "
        + json.dumps(summary, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    (OUTPUT_DIR / "xhs_adhd_cleaned.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    df.to_csv(OUTPUT_DIR / "xhs_adhd_cleaned.csv", index=False, encoding="utf-8-sig")

    print(f"Built cleaned records and summary in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
