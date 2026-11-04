# -*- coding: utf-8 -*-
import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

OUT = '/Users/liugang/Workbuddy/大冶市低空项目软件开发/大屏演示/大冶低空经济总态势大屏设计方案说明.docx'
FIG1 = '/Users/liugang/Workbuddy/大冶市低空项目软件开发/大屏演示/assets/fig1.png'
FIG2 = '/Users/liugang/Workbuddy/大冶市低空项目软件开发/大屏演示/assets/fig2.png'
BLACK = RGBColor(0, 0, 0)


# ---------------- 基础排版工具 ----------------
def set_font(run, cn='宋体', en='Times New Roman', size=12, bold=False):
    run.font.name = en
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = BLACK
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.append(rFonts)
    rFonts.set(qn('w:eastAsia'), cn)
    rFonts.set(qn('w:ascii'), en)
    rFonts.set(qn('w:hAnsi'), en)


def body(doc, text, indent=True, size=12, space_after=0):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    pf.space_before = Pt(0)
    pf.space_after = Pt(space_after)
    pf.first_line_indent = Pt(size * 2) if indent else Pt(0)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r = p.add_run(text)
    set_font(r, size=size)
    return p


def heading(doc, text, level=1):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.keep_with_next = True
    if level == 1:
        pf.space_before = Pt(14); pf.space_after = Pt(6); pf.page_break_before = False
        size = 16
    elif level == 2:
        pf.space_before = Pt(11); pf.space_after = Pt(5)
        size = 14
    else:
        pf.space_before = Pt(9); pf.space_after = Pt(4)
        size = 12
    pf.first_line_indent = Pt(0)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(text)
    set_font(r, cn='黑体', size=size, bold=True)
    # 写入大纲级别，供 TOC 域识别
    pPr = p._p.get_or_add_pPr()
    ol = OxmlElement('w:outlineLvl'); ol.set(qn('w:val'), str(level - 1)); pPr.append(ol)
    sid = {1: 'Heading 1', 2: 'Heading 2', 3: 'Heading 3'}[level]
    p.style = doc.styles[sid]
    return p


def caption(doc, text, before=4, after=6):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(before); pf.space_after = Pt(after)
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    pf.first_line_indent = Pt(0)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(text)
    set_font(r, size=10.5)
    return p


def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), color)
    tcPr.append(shd)


def row_props(row, header=False):
    trPr = row._tr.get_or_add_trPr()
    if header:
        trPr.append(OxmlElement('w:tblHeader'))
    trPr.append(OxmlElement('w:cantSplit'))


def table(doc, data, widths, align=None, head=True, font=10.5):
    rows, cols = len(data), len(data[0])
    t = doc.add_table(rows=rows, cols=cols)
    t.style = doc.styles['Table Grid']
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    tblPr = t._tbl.tblPr
    layout = OxmlElement('w:tblLayout'); layout.set(qn('w:type'), 'fixed'); tblPr.append(layout)
    for i, row in enumerate(data):
        tr = t.rows[i]
        row_props(tr, header=(head and i == 0))
        if head and i == 0:
            tr.height = Cm(0.62)
        for j, val in enumerate(row):
            cell = tr.cells[j]
            cell.width = Cm(widths[j])
            tcPr = cell._tc.get_or_add_tcPr()
            va = OxmlElement('w:vAlign'); va.set(qn('w:val'), 'center'); tcPr.append(va)
            p = cell.paragraphs[0]
            pf = p.paragraph_format
            pf.first_line_indent = Pt(0)
            pf.left_indent = Pt(0); pf.right_indent = Pt(0)
            pf.space_before = Pt(1.5); pf.space_after = Pt(1.5)
            pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
            a = WD_ALIGN_PARAGRAPH.CENTER if (head and i == 0) else WD_ALIGN_PARAGRAPH.LEFT
            if align and i > 0:
                a = {'c': WD_ALIGN_PARAGRAPH.CENTER, 'r': WD_ALIGN_PARAGRAPH.RIGHT,
                     'l': WD_ALIGN_PARAGRAPH.LEFT}[align[j]]
            if align and head and i == 0 and j > 0:
                a = WD_ALIGN_PARAGRAPH.CENTER
            p.alignment = a
            r = p.add_run(str(val))
            set_font(r, cn='宋体', size=font, bold=(head and i == 0))
            if head and i == 0:
                shade(cell, 'F2F2F2')
    return t


def figure(doc, path, width_cm=15.6):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.first_line_indent = Pt(0)
    p.add_run().add_picture(path, width=Cm(width_cm))


def page_field(par):
    run = par.add_run()
    f1 = OxmlElement('w:fldChar'); f1.set(qn('w:fldCharType'), 'begin')
    it = OxmlElement('w:instrText'); it.set(qn('xml:space'), 'preserve'); it.text = ' PAGE '
    f2 = OxmlElement('w:fldChar'); f2.set(qn('w:fldCharType'), 'end')
    run._r.append(f1); run._r.append(it); run._r.append(f2)
    set_font(run, size=10.5)


def toc_field(doc):
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Pt(0)
    fld = OxmlElement('w:fldSimple')
    fld.set(qn('w:instr'), 'TOC \\o "1-2" \\h \\z \\u')
    r = OxmlElement('w:r')
    t = OxmlElement('w:t'); t.text = '（在 Word 中右键选择“更新域”即可生成目录）'
    r.append(t); fld.append(r)
    p._p.append(fld)


# ---------------- 文档骨架 ----------------
doc = Document()
st = doc.styles['Normal']
st.font.name = 'Times New Roman'
st.font.size = Pt(12)
st.element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
st.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
st.paragraph_format.space_before = Pt(0)
st.paragraph_format.space_after = Pt(0)

sec = doc.sections[0]
for s in (sec,):
    s.page_width = Cm(21); s.page_height = Cm(29.7)
    s.top_margin = Cm(2.5); s.bottom_margin = Cm(2.5)
    s.left_margin = Cm(2.5); s.right_margin = Cm(2.5)

# 封面
for _ in range(4):
    doc.add_paragraph()
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.first_line_indent = Pt(0)
r = p.add_run('大冶市低空经济综合服务平台')
set_font(r, cn='黑体', size=18, bold=True)

p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.first_line_indent = Pt(0)
p.paragraph_format.space_before = Pt(6)
r = p.add_run('低空运行总态势大屏设计方案说明')
set_font(r, cn='黑体', size=26, bold=True)

p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.first_line_indent = Pt(0)
p.paragraph_format.space_before = Pt(24)
r = p.add_run('—— 基于《大冶低空平台需求功能清单 V1.0》的功能映射与实现说明')
set_font(r, cn='楷体', size=12)

for _ in range(6):
    doc.add_paragraph()
for line in ['文档版本：V1.0', '编制日期：2026 年 11 月 4 日', '交付形态：单文件大屏 HTML（1920×1080）＋ 本说明']:
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(line)
    set_font(r, cn='宋体', size=10.5)

# 目录页（独立节，无页码）
s2 = doc.add_section(WD_SECTION.NEW_PAGE)
s2.footer.is_linked_to_previous = False
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.first_line_indent = Pt(0)
p.paragraph_format.space_after = Pt(12)
r = p.add_run('目  录')
set_font(r, cn='黑体', size=16, bold=True)
toc_field(doc)

# 正文节
s3 = doc.add_section(WD_SECTION.NEW_PAGE)
s3.footer.is_linked_to_previous = False
pgNum = OxmlElement('w:pgNumType'); pgNum.set(qn('w:start'), '1'); s3._sectPr.append(pgNum)
fp = s3.footer.paragraphs[0]
fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
fp.paragraph_format.first_line_indent = Pt(0)
page_field(fp)
