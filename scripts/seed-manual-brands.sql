-- 수동 등록 브랜드 4개 시드 (OPERATIONS.md §6)
-- 실행: 프로덕션 DB에 1회. 이미 존재하면 건너뜀 (name/slug unique 충돌 방지 ON CONFLICT).
-- 대안: /admin/brands 화면에서 직접 생성해도 동일.

INSERT INTO brands (id, name, "nameKo", slug, "isActive", "followerCount", "createdAt", "updatedAt")
VALUES
  ('manual-st-andrews',          'St. Andrews',          '세인트앤드류스',   'st-andrews',          true, 0, now(), now()),
  ('manual-master-bunny',        'Master Bunny Edition', '마스터바니에디션', 'master-bunny-edition', true, 0, now(), now()),
  ('manual-pearly-gates',        'Pearly Gates',         '파리게이츠',       'pearly-gates',        true, 0, now(), now()),
  ('manual-footjoy',             'FootJoy',              '풋조이',           'footjoy',             true, 0, now(), now())
ON CONFLICT (slug) DO NOTHING;

-- 확인
SELECT name, "nameKo", slug FROM brands WHERE slug IN ('st-andrews','master-bunny-edition','pearly-gates','footjoy');
