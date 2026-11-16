import type { Problem } from "../problems";

export const ARRAYS_SLIDING_PROBLEMS: Problem[] = [
  {
    id: "two-sum",
    slug: "two-sum",
    title: "1. Two Sum",
    difficulty: "Easy",
    topic: "Arrays & Two Pointers",
    acceptance: "52.4%",
    companies: ["Google", "Amazon", "Apple", "Microsoft"],
    diagramType: "array_pointers",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`. You may not use the same element twice.`,
    examples: [
      { input: "nums = [2, 7, 11, 15], target = 9", output: "[0, 1]" },
      { input: "nums = [3, 2, 4], target = 6", output: "[1, 2]" },
    ],
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
    defaultStdin: "2 7 11 15\n9",
    templates: {
      python: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        comp = target - num
        if comp in seen:
            return [seen[comp], i]
        seen[num] = i
    return []

arr = [2, 7, 11, 15]
print("Result:", twoSum(arr, 9))
`,
      javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (seen.has(comp)) return [seen.get(comp), i];
    seen.set(nums[i], i);
  }
  return [];
}
const arr = [2, 7, 11, 15];
console.log("Result:", twoSum(arr, 9));
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        if (seen.count(target - nums[i])) return {seen[target - nums[i]], i};
        seen[nums[i]] = i;
    }
    return {};
}
int main() {
    vector<int> a = {2, 7, 11, 15};
    auto r = twoSum(a, 9);
    cout << r[0] << " " << r[1] << endl;
}
`,
      java: `import java.util.*;
public class Main {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            if (seen.containsKey(target - nums[i])) return new int[]{seen.get(target - nums[i]), i};
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2,7,11,15}, 9)));
    }
}
`,
    },
  },
  {
    id: "best-time-to-buy-sell-stock",
    slug: "best-time-to-buy-sell-stock",
    title: "2. Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Arrays & Two Pointers",
    acceptance: "54.1%",
    companies: ["Amazon", "Goldman Sachs", "Meta", "Microsoft"],
    diagramType: "array_pointers",
    description: `Given an array \`prices\` where \`prices[i]\` is the stock price on day \`i\`, maximize profit by choosing a single day to buy and a future day to sell.`,
    examples: [
      { input: "prices = [7, 1, 5, 3, 6, 4]", output: "5", explanation: "Buy at 1, sell at 6." },
      { input: "prices = [7, 6, 4, 3, 1]", output: "0" },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    defaultStdin: "7 1 5 3 6 4",
    templates: {
      python: `def maxProfit(prices):
    low = prices[0]
    best = 0
    for i in range(1, len(prices)):
        if prices[i] < low:
            low = prices[i]
        else:
            best = max(best, prices[i] - low)
    return best

prices = [7, 1, 5, 3, 6, 4]
print("Max profit:", maxProfit(prices))
`,
      javascript: `function maxProfit(prices) {
  let low = prices[0], best = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] < low) low = prices[i];
    else best = Math.max(best, prices[i] - low);
  }
  return best;
}
const prices = [7, 1, 5, 3, 6, 4];
console.log("Max profit:", maxProfit(prices));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> p = {7, 1, 5, 3, 6, 4};
    int low = p[0], best = 0;
    for (int x : p) { low = min(low, x); best = max(best, x - low); }
    cout << best << endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] p = {7, 1, 5, 3, 6, 4};
        int low = p[0], best = 0;
        for (int x : p) { low = Math.min(low, x); best = Math.max(best, x - low); }
        System.out.println(best);
    }
}
`,
    },
  },
  {
    id: "maximum-subarray",
    slug: "maximum-subarray",
    title: "3. Maximum Subarray (Kadane's Algorithm)",
    difficulty: "Medium",
    topic: "Arrays & Two Pointers",
    acceptance: "51.0%",
    companies: ["Amazon", "Google", "Microsoft", "LinkedIn"],
    diagramType: "array_pointers",
    description: `Given an integer array \`nums\`, find the contiguous subarray with the largest sum and return its sum.`,
    examples: [
      { input: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]", output: "6", explanation: "[4, -1, 2, 1] sums to 6." },
      { input: "nums = [5, 4, -1, 7, 8]", output: "23" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    defaultStdin: "-2 1 -3 4 -1 2 1 -5 4",
    templates: {
      python: `def maxSubArray(nums):
    cur = best = nums[0]
    for i in range(1, len(nums)):
        cur = max(nums[i], cur + nums[i])
        best = max(best, cur)
    return best

nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
print("Max Subarray Sum:", maxSubArray(nums))
`,
      javascript: `function maxSubArray(nums) {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}
const nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
console.log("Max Subarray Sum:", maxSubArray(nums));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    int cur = a[0], best = a[0];
    for (int i = 1; i < (int)a.size(); i++) {
        cur = max(a[i], cur + a[i]);
        best = max(best, cur);
    }
    cout << best << endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] a = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        int cur = a[0], best = a[0];
        for (int i = 1; i < a.length; i++) {
            cur = Math.max(a[i], cur + a[i]);
            best = Math.max(best, cur);
        }
        System.out.println(best);
    }
}
`,
    },
  },
  {
    id: "move-zeroes",
    slug: "move-zeroes",
    title: "4. Move Zeroes In-Place",
    difficulty: "Easy",
    topic: "Arrays & Two Pointers",
    acceptance: "61.8%",
    companies: ["Meta", "Amazon", "TCS", "Infosys"],
    diagramType: "array_pointers",
    description: `Move all \`0\`s to the end of \`nums\` in-place while preserving the relative order of non-zero elements.`,
    examples: [
      { input: "nums = [0, 1, 0, 3, 12]", output: "[1, 3, 12, 0, 0]" },
    ],
    constraints: ["1 <= nums.length <= 10^4"],
    defaultStdin: "0 1 0 3 12",
    templates: {
      python: `def moveZeroes(nums):
    left = 0
    for right in range(len(nums)):
        if nums[right] != 0:
            nums[left], nums[right] = nums[right], nums[left]
            left += 1
    return nums

nums = [0, 1, 0, 3, 12]
print("Result:", moveZeroes(nums))
`,
      javascript: `function moveZeroes(nums) {
  let left = 0;
  for (let right = 0; right < nums.length; right++) {
    if (nums[right] !== 0) {
      [nums[left], nums[right]] = [nums[right], nums[left]];
      left++;
    }
  }
  return nums;
}
const nums = [0, 1, 0, 3, 12];
console.log("Result:", moveZeroes(nums));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {0, 1, 0, 3, 12};
    for (int l = 0, r = 0; r < (int)a.size(); r++)
        if (a[r] != 0) swap(a[l++], a[r]);
    for (int x : a) cout << x << " ";
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] a = {0, 1, 0, 3, 12};
        for (int l = 0, r = 0; r < a.length; r++) {
            if (a[r] != 0) { int t = a[l]; a[l++] = a[r]; a[r] = t; }
        }
        System.out.println(Arrays.toString(a));
    }
}
`,
    },
  },
  {
    id: "two-sum-ii-sorted",
    slug: "two-sum-ii-sorted",
    title: "5. Two Sum II — Sorted Array",
    difficulty: "Medium",
    topic: "Arrays & Two Pointers",
    acceptance: "61.5%",
    companies: ["Amazon", "Google", "Apple"],
    diagramType: "array_pointers",
    description: `Given a 1-indexed sorted integer array \`numbers\`, find two numbers adding up to \`target\` using \`O(1)\` extra space.`,
    examples: [
      { input: "numbers = [2, 7, 11, 15], target = 9", output: "[1, 2]" },
    ],
    constraints: ["2 <= numbers.length <= 3*10^4"],
    defaultStdin: "2 7 11 15\n9",
    templates: {
      python: `def twoSumSorted(numbers, target):
    left, right = 0, len(numbers) - 1
    while left < right:
        s = numbers[left] + numbers[right]
        if s == target:
            return [left + 1, right + 1]
        elif s < target:
            left += 1
        else:
            right -= 1
    return []

numbers = [2, 7, 11, 15]
print("1-based indices:", twoSumSorted(numbers, 9))
`,
      javascript: `function twoSumSorted(numbers, target) {
  let left = 0, right = numbers.length - 1;
  while (left < right) {
    const s = numbers[left] + numbers[right];
    if (s === target) return [left + 1, right + 1];
    if (s < target) left++;
    else right--;
  }
  return [];
}
const numbers = [2, 7, 11, 15];
console.log("1-based indices:", twoSumSorted(numbers, 9));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {2, 7, 11, 15};
    int l = 0, r = a.size() - 1, target = 9;
    while (l < r) {
        int s = a[l] + a[r];
        if (s == target) { cout << l + 1 << " " << r + 1 << endl; break; }
        if (s < target) l++; else r--;
    }
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] a = {2, 7, 11, 15};
        int l = 0, r = a.length - 1, target = 9;
        while (l < r) {
            int s = a[l] + a[r];
            if (s == target) { System.out.println((l+1) + " " + (r+1)); break; }
            if (s < target) l++; else r--;
        }
    }
}
`,
    },
  },
  {
    id: "container-with-most-water",
    slug: "container-with-most-water",
    title: "6. Container With Most Water",
    difficulty: "Medium",
    topic: "Arrays & Two Pointers",
    acceptance: "55.6%",
    companies: ["Amazon", "Google", "Meta", "Bloomberg"],
    diagramType: "array_pointers",
    description: `Find two vertical lines that together with the x-axis form a container holding the maximum amount of water.`,
    examples: [
      { input: "height = [1, 8, 6, 2, 5, 4, 8, 3, 7]", output: "49" },
    ],
    constraints: ["2 <= height.length <= 10^5"],
    defaultStdin: "1 8 6 2 5 4 8 3 7",
    templates: {
      python: `def maxArea(height):
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        best = max(best, (right - left) * min(height[left], height[right]))
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return best

height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
print("Max water area:", maxArea(height))
`,
      javascript: `function maxArea(height) {
  let left = 0, right = height.length - 1, best = 0;
  while (left < right) {
    best = Math.max(best, (right - left) * Math.min(height[left], height[right]));
    if (height[left] < height[right]) left++;
    else right--;
  }
  return best;
}
const height = [1, 8, 6, 2, 5, 4, 8, 3, 7];
console.log("Max water area:", maxArea(height));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> h = {1, 8, 6, 2, 5, 4, 8, 3, 7};
    int l = 0, r = h.size() - 1, best = 0;
    while (l < r) {
        best = max(best, (r - l) * min(h[l], h[r]));
        if (h[l] < h[r]) l++; else r--;
    }
    cout << best << endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] h = {1, 8, 6, 2, 5, 4, 8, 3, 7};
        int l = 0, r = h.length - 1, best = 0;
        while (l < r) {
            best = Math.max(best, (r - l) * Math.min(h[l], h[r]));
            if (h[l] < h[r]) l++; else r--;
        }
        System.out.println(best);
    }
}
`,
    },
  },
  {
    id: "three-sum",
    slug: "three-sum",
    title: "7. 3Sum Triplets",
    difficulty: "Medium",
    topic: "Arrays & Two Pointers",
    acceptance: "34.8%",
    companies: ["Meta", "Amazon", "Google", "Microsoft"],
    diagramType: "array_pointers",
    description: `Return all unique triplets \`[nums[i], nums[j], nums[k]]\` that sum to zero.`,
    examples: [
      { input: "nums = [-1, 0, 1, 2, -1, -4]", output: "[[-1, -1, 2], [-1, 0, 1]]" },
    ],
    constraints: ["3 <= nums.length <= 3000"],
    defaultStdin: "-1 0 1 2 -1 -4",
    templates: {
      python: `def threeSum(nums):
    nums.sort()
    res = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        left, right = i + 1, len(nums) - 1
        while left < right:
            s = nums[i] + nums[left] + nums[right]
            if s < 0:
                left += 1
            elif s > 0:
                right -= 1
            else:
                res.append([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
    return res

nums = [-1, 0, 1, 2, -1, -4]
print("Triplets:", threeSum(nums))
`,
      javascript: `function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let left = i + 1, right = nums.length - 1;
    while (left < right) {
      const s = nums[i] + nums[left] + nums[right];
      if (s < 0) left++;
      else if (s > 0) right--;
      else {
        res.push([nums[i], nums[left], nums[right]]);
        left++; right--;
        while (left < right && nums[left] === nums[left - 1]) left++;
      }
    }
  }
  return res;
}
const nums = [-1, 0, 1, 2, -1, -4];
console.log("Triplets:", JSON.stringify(threeSum(nums)));
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> a = {-1, 0, 1, 2, -1, -4};
    sort(a.begin(), a.end());
    for (int i = 0; i < (int)a.size() - 2; i++) {
        if (i && a[i] == a[i-1]) continue;
        int l = i + 1, r = a.size() - 1;
        while (l < r) {
            int s = a[i] + a[l] + a[r];
            if (s < 0) l++;
            else if (s > 0) r--;
            else { cout << a[i] << "," << a[l] << "," << a[r] << endl; l++; r--; }
        }
    }
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] a = {-1, 0, 1, 2, -1, -4};
        Arrays.sort(a);
        for (int i = 0; i < a.length - 2; i++) {
            if (i > 0 && a[i] == a[i-1]) continue;
            int l = i + 1, r = a.length - 1;
            while (l < r) {
                int s = a[i] + a[l] + a[r];
                if (s < 0) l++; else if (s > 0) r--;
                else { System.out.println(a[i] + "," + a[l++] + "," + a[r--]); }
            }
        }
    }
}
`,
    },
  },
  {
    id: "sort-colors",
    slug: "sort-colors",
    title: "8. Sort Colors (Dutch National Flag)",
    difficulty: "Medium",
    topic: "Arrays & Two Pointers",
    acceptance: "64.2%",
    companies: ["Microsoft", "Amazon", "Adobe", "Flipkart"],
    diagramType: "array_pointers",
    description: `Sort an array containing only \`0\`, \`1\`, and \`2\` in-place in a single pass using three pointers (\`low\`, \`mid\`, \`high\`).`,
    examples: [{ input: "nums = [2, 0, 2, 1, 1, 0]", output: "[0, 0, 1, 1, 2, 2]" }],
    constraints: ["1 <= nums.length <= 300"],
    defaultStdin: "2 0 2 1 1 0",
    templates: {
      python: `def sortColors(nums):
    low = mid = 0
    high = len(nums) - 1
    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1
    return nums

nums = [2, 0, 2, 1, 1, 0]
print("Sorted:", sortColors(nums))
`,
      javascript: `function sortColors(nums) {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++; mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }
  return nums;
}
const nums = [2, 0, 2, 1, 1, 0];
console.log("Sorted:", sortColors(nums));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {2, 0, 2, 1, 1, 0};
    int lo = 0, mid = 0, hi = a.size() - 1;
    while (mid <= hi) {
        if (a[mid] == 0) swap(a[lo++], a[mid++]);
        else if (a[mid] == 1) mid++;
        else swap(a[mid], a[hi--]);
    }
    for (int x : a) cout << x << " ";
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] a = {2, 0, 2, 1, 1, 0};
        int lo = 0, mid = 0, hi = a.length - 1;
        while (mid <= hi) {
            if (a[mid] == 0) { int t = a[lo]; a[lo++] = a[mid]; a[mid++] = t; }
            else if (a[mid] == 1) mid++;
            else { int t = a[mid]; a[mid] = a[hi]; a[hi--] = t; }
        }
        System.out.println(Arrays.toString(a));
    }
}
`,
    },
  },
  {
    id: "trapping-rain-water",
    slug: "trapping-rain-water",
    title: "9. Trapping Rain Water",
    difficulty: "Hard",
    topic: "Arrays & Two Pointers",
    acceptance: "62.1%",
    companies: ["Amazon", "Goldman Sachs", "Google", "Meta"],
    diagramType: "array_pointers",
    description: `Given \`height\` representing an elevation map where width of each bar is 1, compute how much rainwater can be trapped after raining.`,
    examples: [{ input: "height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]", output: "6" }],
    constraints: ["1 <= height.length <= 2*10^4"],
    defaultStdin: "0 1 0 2 1 0 1 3 2 1 2 1",
    templates: {
      python: `def trap(height):
    left, right = 0, len(height) - 1
    lmax = rmax = water = 0
    while left < right:
        if height[left] < height[right]:
            lmax = max(lmax, height[left])
            water += lmax - height[left]
            left += 1
        else:
            rmax = max(rmax, height[right])
            water += rmax - height[right]
            right -= 1
    return water

height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
print("Trapped units:", trap(height))
`,
      javascript: `function trap(height) {
  let left = 0, right = height.length - 1, lmax = 0, rmax = 0, water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      lmax = Math.max(lmax, height[left]);
      water += lmax - height[left++];
    } else {
      rmax = Math.max(rmax, height[right]);
      water += rmax - height[right--];
    }
  }
  return water;
}
const height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
console.log("Trapped units:", trap(height));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> h = {0,1,0,2,1,0,1,3,2,1,2,1};
    int l = 0, r = h.size()-1, lm = 0, rm = 0, ans = 0;
    while (l < r) {
        if (h[l] < h[r]) { lm = max(lm, h[l]); ans += lm - h[l++]; }
        else { rm = max(rm, h[r]); ans += rm - h[r--]; }
    }
    cout << ans << endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] h = {0,1,0,2,1,0,1,3,2,1,2,1};
        int l = 0, r = h.length-1, lm = 0, rm = 0, ans = 0;
        while (l < r) {
            if (h[l] < h[r]) { lm = Math.max(lm, h[l]); ans += lm - h[l++]; }
            else { rm = Math.max(rm, h[r]); ans += rm - h[r--]; }
        }
        System.out.println(ans);
    }
}
`,
    },
  },
  {
    id: "product-of-array-except-self",
    slug: "product-of-array-except-self",
    title: "10. Product of Array Except Self",
    difficulty: "Medium",
    topic: "Arrays & Two Pointers",
    acceptance: "66.3%",
    companies: ["Meta", "Amazon", "Microsoft", "Apple"],
    diagramType: "array_pointers",
    description: `Return an array \`answer\` where \`answer[i]\` equals the product of all elements except \`nums[i]\` without using division.`,
    examples: [{ input: "nums = [1, 2, 3, 4]", output: "[24, 12, 8, 6]" }],
    constraints: ["2 <= nums.length <= 10^5"],
    defaultStdin: "1 2 3 4",
    templates: {
      python: `def productExceptSelf(nums):
    n = len(nums)
    ans = [1] * n
    prefix = 1
    for i in range(n):
        ans[i] = prefix
        prefix *= nums[i]
    suffix = 1
    for i in range(n - 1, -1, -1):
        ans[i] *= suffix
        suffix *= nums[i]
    return ans

nums = [1, 2, 3, 4]
print("Products:", productExceptSelf(nums))
`,
      javascript: `function productExceptSelf(nums) {
  const n = nums.length, ans = Array(n).fill(1);
  let prefix = 1;
  for (let i = 0; i < n; i++) { ans[i] = prefix; prefix *= nums[i]; }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) { ans[i] *= suffix; suffix *= nums[i]; }
  return ans;
}
const nums = [1, 2, 3, 4];
console.log("Products:", productExceptSelf(nums));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {1,2,3,4}, res(4, 1);
    for (int i = 0, p = 1; i < 4; i++) { res[i] = p; p *= a[i]; }
    for (int i = 3, s = 1; i >= 0; i--) { res[i] *= s; s *= a[i]; }
    for (int x : res) cout << x << " ";
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] a = {1,2,3,4}, res = new int[4];
        for (int i = 0, p = 1; i < 4; i++) { res[i] = p; p *= a[i]; }
        for (int i = 3, s = 1; i >= 0; i--) { res[i] *= s; s *= a[i]; }
        System.out.println(Arrays.toString(res));
    }
}
`,
    },
  },
  {
    id: "merge-intervals",
    slug: "merge-intervals",
    title: "11. Merge Overlapping Intervals",
    difficulty: "Medium",
    topic: "Arrays & Two Pointers",
    acceptance: "47.8%",
    companies: ["Meta", "Google", "Amazon", "Salesforce"],
    diagramType: "array_pointers",
    description: `Given an array of intervals \`[start, end]\`, merge all overlapping intervals and return non-overlapping intervals.`,
    examples: [{ input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" }],
    constraints: ["1 <= intervals.length <= 10^4"],
    defaultStdin: "1 3\n2 6\n8 10\n15 18",
    templates: {
      python: `def mergeIntervals(intervals):
    intervals.sort()
    merged = [intervals[0]]
    for i in range(1, len(intervals)):
        s, e = intervals[i]
        if s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return merged

intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]
print("Merged:", mergeIntervals(intervals))
`,
      javascript: `function mergeIntervals(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const [s, e] = intervals[i];
    if (s <= merged[merged.length - 1][1]) merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    else merged.push([s, e]);
  }
  return merged;
}
const intervals = [[1, 3], [2, 6], [8, 10], [15, 18]];
console.log("Merged:", JSON.stringify(mergeIntervals(intervals)));
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<pair<int,int>> iv = {{1,3},{2,6},{8,10},{15,18}}, out;
    sort(iv.begin(), iv.end());
    for (auto p : iv) {
        if (out.empty() || out.back().second < p.first) out.push_back(p);
        else out.back().second = max(out.back().second, p.second);
    }
    for (auto p : out) cout << "[" << p.first << "," << p.second << "] ";
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[][] iv = {{1,3},{2,6},{8,10},{15,18}};
        Arrays.sort(iv, (a,b) -> a[0]-b[0]);
        List<int[]> out = new ArrayList<>();
        for (int[] p : iv) {
            if (out.isEmpty() || out.get(out.size()-1)[1] < p[0]) out.add(p);
            else out.get(out.size()-1)[1] = Math.max(out.get(out.size()-1)[1], p[1]);
        }
        System.out.println(out.size());
    }
}
`,
    },
  },
  {
    id: "rotate-array-right",
    slug: "rotate-array-right",
    title: "12. Rotate Array Right by K",
    difficulty: "Medium",
    topic: "Arrays & Two Pointers",
    acceptance: "41.2%",
    companies: ["Amazon", "Microsoft", "TCS", "Adobe"],
    diagramType: "array_pointers",
    description: `Rotate an array \`nums\` to the right by \`k\` steps in \`O(1)\` extra space using three reversals.`,
    examples: [{ input: "nums = [1,2,3,4,5,6,7], k = 3", output: "[5,6,7,1,2,3,4]" }],
    constraints: ["1 <= nums.length <= 10^5", "0 <= k <= 10^5"],
    defaultStdin: "1 2 3 4 5 6 7\n3",
    templates: {
      python: `def reverse(arr, left, right):
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1

def rotate(nums, k):
    n = len(nums)
    k %= n
    reverse(nums, 0, n - 1)
    reverse(nums, 0, k - 1)
    reverse(nums, k, n - 1)
    return nums

nums = [1, 2, 3, 4, 5, 6, 7]
print("Rotated:", rotate(nums, 3))
`,
      javascript: `function rev(arr, left, right) {
  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++; right--;
  }
}
function rotate(nums, k) {
  const n = nums.length; k %= n;
  rev(nums, 0, n - 1); rev(nums, 0, k - 1); rev(nums, k, n - 1);
  return nums;
}
const nums = [1, 2, 3, 4, 5, 6, 7];
console.log("Rotated:", rotate(nums, 3));
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> a = {1,2,3,4,5,6,7}; int k = 3;
    std::rotate(a.begin(), a.end() - k, a.end());
    for (int x : a) cout << x << " ";
}
`,
      java: `import java.util.*;
public class Main {
    static void rev(int[] a, int l, int r){ while(l<r){int t=a[l];a[l++]=a[r];a[r--]=t;} }
    public static void main(String[] args) {
        int[] a = {1,2,3,4,5,6,7}; int k = 3;
        rev(a,0,a.length-1); rev(a,0,k-1); rev(a,k,a.length-1);
        System.out.println(Arrays.toString(a));
    }
}
`,
    },
  },
  {
    id: "max-average-subarray-i",
    slug: "max-average-subarray-i",
    title: "13. Maximum Average Subarray I",
    difficulty: "Easy",
    topic: "Sliding Window",
    acceptance: "43.9%",
    companies: ["Google", "Meta", "Amazon"],
    diagramType: "array_pointers",
    description: `Find a contiguous subarray whose length is equal to \`k\` that has the maximum average value.`,
    examples: [{ input: "nums = [1, 12, -5, -6, 50, 3], k = 4", output: "12.75" }],
    constraints: ["1 <= k <= nums.length <= 10^5"],
    defaultStdin: "1 12 -5 -6 50 3\n4",
    templates: {
      python: `def findMaxAverage(nums, k):
    window_sum = sum(nums[:k])
    best = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        best = max(best, window_sum)
    return best / k

nums = [1, 12, -5, -6, 50, 3]
print("Max Average:", findMaxAverage(nums, 4))
`,
      javascript: `function findMaxAverage(nums, k) {
  let sum = nums.slice(0, k).reduce((a, b) => a + b, 0), best = sum;
  for (let i = k; i < nums.length; i++) {
    sum += nums[i] - nums[i - k];
    best = Math.max(best, sum);
  }
  return best / k;
}
const nums = [1, 12, -5, -6, 50, 3];
console.log("Max Average:", findMaxAverage(nums, 4));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {1,12,-5,-6,50,3}; int k = 4, s = 0;
    for (int i = 0; i < k; i++) s += a[i];
    int best = s;
    for (int i = k; i < (int)a.size(); i++) { s += a[i] - a[i-k]; best = max(best, s); }
    cout << best / 4.0 << endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] a = {1,12,-5,-6,50,3}; int k = 4, s = 0;
        for (int i = 0; i < k; i++) s += a[i];
        int best = s;
        for (int i = k; i < a.length; i++) { s += a[i] - a[i-k]; best = Math.max(best, s); }
        System.out.println(best / 4.0);
    }
}
`,
    },
  },
  {
    id: "min-size-subarray-sum",
    slug: "min-size-subarray-sum",
    title: "14. Minimum Size Subarray Sum",
    difficulty: "Medium",
    topic: "Sliding Window",
    acceptance: "47.3%",
    companies: ["Goldman Sachs", "Google", "Amazon"],
    diagramType: "array_pointers",
    description: `Return the minimal length of a contiguous subarray of which the sum is greater than or equal to \`target\`. If none exists, return \`0\`.`,
    examples: [{ input: "target = 7, nums = [2, 3, 1, 2, 4, 3]", output: "2" }],
    constraints: ["1 <= nums.length <= 10^5", "nums[i] >= 1"],
    defaultStdin: "2 3 1 2 4 3\n7",
    templates: {
      python: `def minSubArrayLen(target, nums):
    left = s = 0
    best = len(nums) + 1
    for right in range(len(nums)):
        s += nums[right]
        while s >= target:
            best = min(best, right - left + 1)
            s -= nums[left]
            left += 1
    return 0 if best > len(nums) else best

nums = [2, 3, 1, 2, 4, 3]
print("Min length:", minSubArrayLen(7, nums))
`,
      javascript: `function minSubArrayLen(target, nums) {
  let left = 0, s = 0, best = nums.length + 1;
  for (let right = 0; right < nums.length; right++) {
    s += nums[right];
    while (s >= target) {
      best = Math.min(best, right - left + 1);
      s -= nums[left++];
    }
  }
  return best > nums.length ? 0 : best;
}
const nums = [2, 3, 1, 2, 4, 3];
console.log("Min length:", minSubArrayLen(7, nums));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {2,3,1,2,4,3}; int target = 7, l = 0, s = 0, best = 1e9;
    for (int r = 0; r < (int)a.size(); r++) {
        s += a[r];
        while (s >= target) { best = min(best, r - l + 1); s -= a[l++]; }
    }
    cout << (best == 1e9 ? 0 : best) << endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] a = {2,3,1,2,4,3}; int target = 7, l = 0, s = 0, best = Integer.MAX_VALUE;
        for (int r = 0; r < a.length; r++) {
            s += a[r];
            while (s >= target) { best = Math.min(best, r - l + 1); s -= a[l++]; }
        }
        System.out.println(best == Integer.MAX_VALUE ? 0 : best);
    }
}
`,
    },
  },
  {
    id: "subarray-sum-equals-k",
    slug: "subarray-sum-equals-k",
    title: "15. Subarray Sum Equals K",
    difficulty: "Medium",
    topic: "Arrays & Two Pointers",
    acceptance: "44.0%",
    companies: ["Meta", "Amazon", "Google", "Uber"],
    diagramType: "array_pointers",
    description: `Count the total number of continuous subarrays whose sum equals \`k\`.`,
    examples: [{ input: "nums = [1, 1, 1], k = 2", output: "2" }],
    constraints: ["1 <= nums.length <= 2*10^4"],
    defaultStdin: "1 2 3\n3",
    templates: {
      python: `def subarraySum(nums, k):
    seen = {0: 1}
    prefix = count = 0
    for i, x in enumerate(nums):
        prefix += x
        count += seen.get(prefix - k, 0)
        seen[prefix] = seen.get(prefix, 0) + 1
    return count

nums = [1, 2, 1, 2, 1]
print("Subarray count:", subarraySum(nums, 3))
`,
      javascript: `function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]);
  let prefix = 0, count = 0;
  for (let i = 0; i < nums.length; i++) {
    prefix += nums[i];
    count += seen.get(prefix - k) || 0;
    seen.set(prefix, (seen.get(prefix) || 0) + 1);
  }
  return count;
}
const nums = [1, 2, 1, 2, 1];
console.log("Subarray count:", subarraySum(nums, 3));
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
int main() {
    vector<int> a = {1,2,1,2,1}; int k = 3, p = 0, ans = 0;
    unordered_map<int,int> seen{{0,1}};
    for (int x : a) { p += x; ans += seen[p - k]; seen[p]++; }
    cout << ans << endl;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] a = {1,2,1,2,1}; int k = 3, p = 0, ans = 0;
        Map<Integer,Integer> seen = new HashMap<>(); seen.put(0, 1);
        for (int x : a) { p += x; ans += seen.getOrDefault(p - k, 0); seen.put(p, seen.getOrDefault(p,0)+1); }
        System.out.println(ans);
    }
}
`,
    },
  },
  {
    id: "longest-consecutive-sequence",
    slug: "longest-consecutive-sequence",
    title: "16. Longest Consecutive Sequence",
    difficulty: "Medium",
    topic: "Arrays & Two Pointers",
    acceptance: "47.2%",
    companies: ["Google", "Amazon", "Meta", "Spotify"],
    diagramType: "array_pointers",
    description: `Find the length of the longest consecutive elements sequence in \`O(n)\` time.`,
    examples: [{ input: "nums = [100, 4, 200, 1, 3, 2]", output: "4", explanation: "[1, 2, 3, 4]" }],
    constraints: ["0 <= nums.length <= 10^5"],
    defaultStdin: "100 4 200 1 3 2",
    templates: {
      python: `def longestConsecutive(nums):
    s = set(nums)
    best = 0
    for i, x in enumerate(nums):
        if x - 1 not in s:
            cur = x
            while cur in s:
                cur += 1
            best = max(best, cur - x)
    return best

nums = [100, 4, 200, 1, 3, 2]
print("Longest consecutive:", longestConsecutive(nums))
`,
      javascript: `function longestConsecutive(nums) {
  const s = new Set(nums);
  let best = 0;
  for (let i = 0; i < nums.length; i++) {
    const x = nums[i];
    if (!s.has(x - 1)) {
      let cur = x;
      while (s.has(cur)) cur++;
      best = Math.max(best, cur - x);
    }
  }
  return best;
}
const nums = [100, 4, 200, 1, 3, 2];
console.log("Longest consecutive:", longestConsecutive(nums));
`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_set>
using namespace std;
int main() {
    vector<int> a = {100,4,200,1,3,2};
    unordered_set<int> s(a.begin(), a.end());
    int best = 0;
    for (int x : s) if (!s.count(x - 1)) { int c = x; while (s.count(c)) c++; best = max(best, c - x); }
    cout << best << endl;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] a = {100,4,200,1,3,2};
        Set<Integer> s = new HashSet<>(); for (int x : a) s.add(x);
        int best = 0;
        for (int x : s) if (!s.contains(x-1)) { int c=x; while(s.contains(c)) c++; best=Math.max(best,c-x); }
        System.out.println(best);
    }
}
`,
    },
  },
  {
    id: "sliding-window-maximum",
    slug: "sliding-window-maximum",
    title: "17. Sliding Window Maximum",
    difficulty: "Hard",
    topic: "Sliding Window",
    acceptance: "46.7%",
    companies: ["Google", "Amazon", "Uber", "Atlassian"],
    diagramType: "array_pointers",
    description: `Given an array \`nums\` and a sliding window of size \`k\` moving right by 1, return the maximum element in each window.`,
    examples: [{ input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[3,3,5,5,6,7]" }],
    constraints: ["1 <= k <= nums.length <= 10^5"],
    defaultStdin: "1 3 -1 -3 5 3 6 7\n3",
    templates: {
      python: `from collections import deque

def maxSlidingWindow(nums, k):
    dq = deque()
    res = []
    for i, x in enumerate(nums):
        while dq and dq[0] <= i - k:
            dq.popleft()
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            res.append(nums[dq[0]])
    return res

nums = [1, 3, -1, -3, 5, 3, 6, 7]
print("Window maxima:", maxSlidingWindow(nums, 3))
`,
      javascript: `function maxSlidingWindow(nums, k) {
  const dq = [], res = [];
  for (let i = 0; i < nums.length; i++) {
    while (dq.length && dq[0] <= i - k) dq.shift();
    while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
    dq.push(i);
    if (i >= k - 1) res.push(nums[dq[0]]);
  }
  return res;
}
const nums = [1, 3, -1, -3, 5, 3, 6, 7];
console.log("Window maxima:", maxSlidingWindow(nums, 3));
`,
      cpp: `#include <iostream>
#include <vector>
#include <deque>
using namespace std;
int main() {
    vector<int> a = {1,3,-1,-3,5,3,6,7}; int k = 3;
    deque<int> dq;
    for (int i = 0; i < (int)a.size(); i++) {
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();
        dq.push_back(i);
        if (i >= k - 1) cout << a[dq.front()] << " ";
    }
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        int[] a = {1,3,-1,-3,5,3,6,7}; int k = 3;
        Deque<Integer> dq = new ArrayDeque<>();
        for (int i = 0; i < a.length; i++) {
            if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();
            while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
            dq.offerLast(i);
            if (i >= k - 1) System.out.print(a[dq.peekFirst()] + " ");
        }
    }
}
`,
    },
  },
  {
    id: "missing-number",
    slug: "missing-number",
    title: "18. Missing Number in [0..n]",
    difficulty: "Easy",
    topic: "Arrays & Two Pointers",
    acceptance: "66.7%",
    companies: ["Amazon", "TCS", "Microsoft", "Wipro"],
    diagramType: "array_pointers",
    description: `Given an array containing \`n\` distinct numbers taken from \`0, 1, ..., n\`, return the one missing number.`,
    examples: [{ input: "nums = [3, 0, 1]", output: "2" }],
    constraints: ["1 <= n <= 10^4"],
    defaultStdin: "3 0 1",
    templates: {
      python: `def missingNumber(nums):
    missing = len(nums)
    for i, x in enumerate(nums):
        missing ^= i ^ x
    return missing

nums = [3, 0, 1]
print("Missing:", missingNumber(nums))
`,
      javascript: `function missingNumber(nums) {
  let missing = nums.length;
  for (let i = 0; i < nums.length; i++) missing ^= i ^ nums[i];
  return missing;
}
const nums = [3, 0, 1];
console.log("Missing:", missingNumber(nums));
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {3, 0, 1}; int m = a.size();
    for (int i = 0; i < (int)a.size(); i++) m ^= i ^ a[i];
    cout << m << endl;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] a = {3, 0, 1}; int m = a.length;
        for (int i = 0; i < a.length; i++) m ^= i ^ a[i];
        System.out.println(m);
    }
}
`,
    },
  },
];
